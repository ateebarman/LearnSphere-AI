import { aiService } from './interviewService.js';
import {
  INTRO_PROMPT, DSA_SYSTEM_PROMPT, RESUME_SYSTEM_PROMPT,
  HR_SYSTEM_PROMPT, FOLLOWUP_PROMPT, EVALUATION_PROMPT, VOICE_SYSTEM_PROMPT,
  WARMUP_PROMPT, SILENCE_NUDGE_PROMPT, SILENCE_TIMEOUT_PROMPT, CLARIFICATION_PROMPT,
  DSA_PROBLEM_PROMPT, STAGE_TIMER_CONFIG,
} from './interviewPrompts.js';
import User from '../models/userModel.js';
import Interview from '../models/interviewModel.js';

// In-memory session store fallback
const memorySessions = new Map();
const silenceNudgeTimers = new Map();
const silenceTimeoutTimers = new Map();

const SILENCE_NUDGE_DELAY = 12_000;    // 12 seconds
const SILENCE_TIMEOUT_DELAY = 30_000; // 30 seconds

async function getSession(sessionId) {
  return memorySessions.get(sessionId) || null;
}

async function saveSession(sessionId, state) {
  memorySessions.set(sessionId, state);
}

const STAGE_FLOW = [
  'WARMUP', 'INTRO', 'RESUME_DISCUSSION', 'DSA_ROUND', 'FOLLOW_UP', 'HR_ROUND', 'FEEDBACK', 'END'
];

const WARMUP_MAX_EXCHANGES = 3;

// Compute adaptive difficulty level from recent answers
function computeAdaptiveLevel(state) {
  if (state.difficulty !== 'adaptive') return undefined;
  return state.adaptiveLevel ?? 3;
}

function updateAdaptiveLevel(state, answerContent) {
  if (state.difficulty !== 'adaptive') return;
  const wordCount = answerContent.trim().split(/\s+/).length;
  const hasUncertainty = /i don'?t know|not sure|no idea|stuck|help/i.test(answerContent);

  let level = state.adaptiveLevel ?? 3;

  if (hasUncertainty || wordCount < 20) {
    level = Math.max(1, level - 1);
  } else if (wordCount > 120 && !hasUncertainty) {
    level = Math.min(5, level + 1);
  }
  state.adaptiveLevel = level;
}

function getSystemPrompt(state) {
  const base = state.voiceMode ? VOICE_SYSTEM_PROMPT + '\n\n' : '';
  switch (state.stage) {
    case 'WARMUP':
      return base + WARMUP_PROMPT(state.candidateName, state.role, state.company);
    case 'INTRO':
      return base + INTRO_PROMPT(state.candidateName, state.role, state.company);
    case 'RESUME_DISCUSSION':
      return base + RESUME_SYSTEM_PROMPT(state.resumeData, state.company);
    case 'DSA_ROUND':
      return base + DSA_SYSTEM_PROMPT(state.difficulty, state.topic || 'Data Structures & Algorithms', state.company, computeAdaptiveLevel(state));
    case 'HR_ROUND':
      return base + HR_SYSTEM_PROMPT(state.company);
    default:
      return base + INTRO_PROMPT(state.candidateName, state.role, state.company);
  }
}

function getTimerConfig(stage) {
  return STAGE_TIMER_CONFIG[stage] ?? 0;
}

function clearSilenceTimers(interviewId) {
  const nudge = silenceNudgeTimers.get(interviewId);
  const timeout = silenceTimeoutTimers.get(interviewId);
  if (nudge) { clearTimeout(nudge); silenceNudgeTimers.delete(interviewId); }
  if (timeout) { clearTimeout(timeout); silenceTimeoutTimers.delete(interviewId); }
}

function startSilenceWatchdog(interviewId, state, socket, io) {
  clearSilenceTimers(interviewId);

  const nudgeTimer = setTimeout(async () => {
    const latestState = await getSession(interviewId);
    if (!latestState || latestState.stage !== state.stage || latestState.isPaused) return;

    socket.emit('interview:typing', true);
    let nudgeText = '';
    try {
      await aiService.generateStream({
        messages: [{
          role: 'system',
          content: SILENCE_NUDGE_PROMPT(latestState.currentQuestion, latestState.stage),
        }],
        temperature: 0.8,
        maxTokens: 80,
      }, (chunk) => {
        if (!chunk.isDone) {
          nudgeText += chunk.content;
          socket.emit('interview:ai_chunk', { content: chunk.content, isSilenceNudge: true });
        } else {
          socket.emit('interview:ai_done', { fullMessage: nudgeText, isSilenceNudge: true });
          socket.emit('interview:typing', false);
          socket.emit('interview:silence_nudge', { message: nudgeText });
        }
      });
    } catch {
      socket.emit('interview:typing', false);
      socket.emit('interview:silence_nudge', { message: "Take your time — what are you thinking through?" });
    }
  }, SILENCE_NUDGE_DELAY);

  silenceNudgeTimers.set(interviewId, nudgeTimer);

  const timeoutTimer = setTimeout(async () => {
    const latestState = await getSession(interviewId);
    if (!latestState || latestState.stage !== state.stage || latestState.isPaused) return;

    socket.emit('interview:typing', true);
    let transitionText = '';
    try {
      await aiService.generateStream({
        messages: [{
          role: 'system',
          content: SILENCE_TIMEOUT_PROMPT(latestState.currentQuestion),
        }],
        temperature: 0.7,
        maxTokens: 80,
      }, (chunk) => {
        if (!chunk.isDone) {
          transitionText += chunk.content;
          socket.emit('interview:ai_chunk', { content: chunk.content, isSilenceTimeout: true });
        } else {
          socket.emit('interview:ai_done', { fullMessage: transitionText, isSilenceTimeout: true });
          socket.emit('interview:typing', false);
          socket.emit('interview:silence_timeout', { message: transitionText });

          latestState.transcript.push({ role: 'user', content: '[No response — silence timeout]', timestamp: Date.now(), stage: latestState.stage });
          latestState.questionCount++;
          saveSession(interviewId, latestState);
        }
      });
    } catch {
      socket.emit('interview:typing', false);
      socket.emit('interview:silence_timeout', { message: "No worries! Let's move on to something different." });
    }
  }, SILENCE_TIMEOUT_DELAY);

  silenceTimeoutTimers.set(interviewId, timeoutTimer);
}

export function setupInterviewHandlers(io, socket) {
  socket.on('interview:join', async ({ interviewId, candidateName, mode, company, role, difficulty, resumeData, voiceMode }) => {
    socket.join(interviewId);

    let state = await getSession(interviewId);
    if (!state) {
      // Fetch full user profile from DB for rich resume context
      let richResumeData = resumeData;
      try {
        const interviewDoc = await Interview.findById(interviewId).select('candidateId');
        if (interviewDoc?.candidateId) {
          const user = await User.findById(interviewDoc.candidateId).select('profile name');
          if (user?.profile?.resumeData) {
            richResumeData = user.profile.resumeData;
            console.log(`📄 Loaded resume from DB for ${user.name || candidateName}`);
          } else if (user?.profile?.skills?.length) {
            // Fallback: use skills array if no structured resumeData
            richResumeData = { skills: user.profile.skills };
          }
        }
      } catch (e) {
        console.warn('Could not fetch user profile for resume context:', e.message);
      }

      state = {
        interviewId,
        candidateName: candidateName || 'Candidate',
        stage: 'WARMUP',
        mode: mode || 'mock',
        company: company || 'generic',
        role: role || 'Software Engineer',
        difficulty: difficulty || 'adaptive',
        topic: null,
        resumeData: richResumeData,
        transcript: [],
        askedQuestions: [],
        currentQuestion: '',
        voiceMode: voiceMode ?? false,
        scores: {},
        questionCount: 0,
        warmupExchanges: 0,
        isClarifying: false,
        pendingClarificationQuestion: '',
        hintsUsed: 0,
        isPaused: false,
        adaptiveLevel: 3,
        codingProblem: null,
      };
      await saveSession(interviewId, state);
    }

    socket.emit('interview:state', {
      stage: state.stage,
      mode: state.mode,
      company: state.company,
      timerSeconds: getTimerConfig(state.stage),
      hintsUsed: state.hintsUsed,
      transcript: state.transcript,
      codingProblem: state.codingProblem,
    });
    console.log(`📋 ${candidateName} joined interview ${interviewId} [${state.stage}]`);

    if (state.transcript.length === 0) {
      socket.emit('interview:typing', true);
      let introMessage = '';
      await aiService.generateStream({
        messages: [
          { role: 'system', content: getSystemPrompt(state) },
          { role: 'user', content: 'Start the warm-up. Be brief and friendly.' }
        ],
        temperature: 0.9,
        maxTokens: 150,
      }, (chunk) => {
        if (!chunk.isDone) {
          introMessage += chunk.content;
          socket.emit('interview:ai_chunk', { content: chunk.content });
        } else {
          socket.emit('interview:ai_done', { fullMessage: introMessage });
          socket.emit('interview:typing', false);
          state.transcript.push({ role: 'assistant', content: introMessage, timestamp: Date.now(), stage: state.stage });
          state.currentQuestion = introMessage;
          saveSession(interviewId, state);
          startSilenceWatchdog(interviewId, state, socket, io);
        }
      });
    }
  });

  socket.on('interview:message', async ({ interviewId, content, isVoice, isSilenceAutoSubmit }) => {
    const state = await getSession(interviewId);
    if (!state) return socket.emit('interview:error', 'Session not found. Please refresh.');
    if (state.isPaused) return socket.emit('interview:error', 'Interview is paused.');

    clearSilenceTimers(interviewId);

    state.transcript.push({ role: 'user', content, timestamp: Date.now(), stage: state.stage });
    state.questionCount++;

    // Update adaptive difficulty based on answer quality
    updateAdaptiveLevel(state, content);

    const isQuestion = content.includes('?') && content.length < 200;
    const isWarmup = state.stage === 'WARMUP';

    if (isWarmup) {
      state.warmupExchanges++;
      if (state.warmupExchanges >= WARMUP_MAX_EXCHANGES) {
        state.stage = 'INTRO';
        state.questionCount = 0;
        await saveSession(interviewId, state);

        socket.emit('interview:typing', true);
        let transitionMsg = '';
        const transitionPrompt = `You are transitioning from warm-up to the actual interview. Say something like "Alright, let's get started!" in 1 brief sentence, then begin the interview introduction naturally. ${getSystemPrompt({ ...state, stage: 'INTRO' })}`;

        await aiService.generateStream({
          messages: [
            { role: 'system', content: transitionPrompt },
            ...state.transcript.slice(-4).map(m => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.8,
          maxTokens: 200,
        }, (chunk) => {
          if (!chunk.isDone) {
            transitionMsg += chunk.content;
            socket.emit('interview:ai_chunk', { content: chunk.content });
          } else {
            socket.emit('interview:ai_done', { fullMessage: transitionMsg });
            socket.emit('interview:typing', false);
            socket.emit('interview:stage_changed', {
              stage: 'INTRO',
              timerSeconds: getTimerConfig('INTRO'),
            });
            state.transcript.push({ role: 'assistant', content: transitionMsg, timestamp: Date.now(), stage: 'INTRO' });
            state.currentQuestion = transitionMsg;
            saveSession(interviewId, state);
            startSilenceWatchdog(interviewId, state, socket, io);
          }
        });
        return;
      }
    }

    if (isQuestion && !isWarmup && !isSilenceAutoSubmit && state.currentQuestion) {
      state.isClarifying = true;
      state.pendingClarificationQuestion = state.currentQuestion;
      await saveSession(interviewId, state);

      socket.emit('interview:typing', true);
      socket.emit('interview:clarification_mode', { active: true });
      let clarifyResponse = '';
      await aiService.generateStream({
        messages: [{
          role: 'system',
          content: CLARIFICATION_PROMPT(content, state.currentQuestion, state.stage),
        }],
        temperature: 0.6,
        maxTokens: 150,
      }, (chunk) => {
        if (!chunk.isDone) {
          clarifyResponse += chunk.content;
          socket.emit('interview:ai_chunk', { content: chunk.content });
        } else {
          socket.emit('interview:ai_done', { fullMessage: clarifyResponse });
          socket.emit('interview:typing', false);
          socket.emit('interview:clarification_mode', { active: false });
          state.transcript.push({ role: 'assistant', content: clarifyResponse, timestamp: Date.now(), stage: state.stage });
          state.currentQuestion = clarifyResponse;
          state.isClarifying = false;
          saveSession(interviewId, state);
          startSilenceWatchdog(interviewId, state, socket, io);
        }
      });
      return;
    }

    let systemPrompt = getSystemPrompt(state);
    const recentHistory = state.transcript.slice(-12).map(m => ({ role: m.role, content: m.content }));

    // Inject coding problem context into DSA round
    if (state.stage === 'DSA_ROUND' && state.codingProblem) {
      systemPrompt += `\n\nCODING PROBLEM IN PANEL:\nTitle: ${state.codingProblem.title}\nDescription: ${state.codingProblem.description}\nOptimal: Time ${state.codingProblem.optimalComplexity?.time}, Space ${state.codingProblem.optimalComplexity?.space}\nFollow-ups: ${(state.codingProblem.followUpQuestions || []).join(', ')}`;
    }

    socket.emit('interview:typing', true);
    let fullResponse = '';
    try {
      await aiService.generateStream({
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentHistory,
        ],
        temperature: 0.7,
        maxTokens: state.voiceMode ? 200 : 600,
      }, (chunk) => {
        if (!chunk.isDone) {
          fullResponse += chunk.content;
          socket.emit('interview:ai_chunk', { content: chunk.content });
        } else {
          socket.emit('interview:ai_done', { fullMessage: fullResponse });
          socket.emit('interview:typing', false);
          state.transcript.push({ role: 'assistant', content: fullResponse, timestamp: Date.now(), stage: state.stage });
          state.currentQuestion = fullResponse;
          saveSession(interviewId, state);
          startSilenceWatchdog(interviewId, state, socket, io);
        }
      });
    } catch (err) {
      socket.emit('interview:typing', false);
      socket.emit('interview:error', 'AI service temporarily unavailable. Please try again.');
    }
  });

  socket.on('interview:next_stage', async ({ interviewId }) => {
    const state = await getSession(interviewId);
    if (!state) return;

    clearSilenceTimers(interviewId);

    const currentIndex = STAGE_FLOW.indexOf(state.stage);
    const nextStage = STAGE_FLOW[currentIndex + 1] || 'END';
    state.stage = nextStage;
    state.questionCount = 0;
    await saveSession(interviewId, state);

    io.to(interviewId).emit('interview:stage_changed', {
      stage: nextStage,
      timerSeconds: getTimerConfig(nextStage),
    });

    // Pre-generate DSA problem when entering coding round
    if (nextStage === 'DSA_ROUND') {
      try {
        socket.emit('interview:problem_generating', true);
        const problem = await aiService.generateStructuredResponse({
          messages: [{
            role: 'user',
            content: DSA_PROBLEM_PROMPT(state.topic || 'Arrays', state.difficulty === 'adaptive' ? 'medium' : state.difficulty, state.company)
          }],
          temperature: 0.4,
          maxTokens: 1500,
        });
        state.codingProblem = problem;
        await saveSession(interviewId, state);

        // Save to DB as well
        try {
          await Interview.findByIdAndUpdate(interviewId, { codingProblem: problem });
        } catch (e) { /* non-critical */ }

        socket.emit('interview:coding_problem', problem);
        socket.emit('interview:problem_generating', false);
        console.log(`🧩 Pre-generated DSA problem for session ${interviewId}: ${problem.title}`);
      } catch (e) {
        socket.emit('interview:problem_generating', false);
        console.warn('Problem pre-generation failed, AI will improvise:', e.message);
      }
    }

    if (nextStage === 'FEEDBACK') {
      socket.emit('interview:typing', true);
      try {
        const evaluation = await aiService.generateStructuredResponse({
          messages: [{
            role: 'user',
            content: EVALUATION_PROMPT(state.transcript, state.stage, state.role)
          }],
          temperature: 0.2,
          maxTokens: 1200,
        });
        socket.emit('interview:evaluation', evaluation);
        socket.emit('interview:typing', false);
      } catch (e) {
        socket.emit('interview:typing', false);
        socket.emit('interview:error', 'Failed to generate evaluation.');
      }
    }
  });

  socket.on('interview:pause', async ({ interviewId }) => {
    const state = await getSession(interviewId);
    if (!state) return;
    clearSilenceTimers(interviewId);
    state.isPaused = true;
    await saveSession(interviewId, state);
    io.to(interviewId).emit('interview:paused');
  });

  socket.on('interview:resume', async ({ interviewId }) => {
    const state = await getSession(interviewId);
    if (!state) return;
    state.isPaused = false;
    await saveSession(interviewId, state);
    io.to(interviewId).emit('interview:resumed');
    startSilenceWatchdog(interviewId, state, socket, io);
  });

  socket.on('interview:hint', async ({ interviewId }) => {
    const state = await getSession(interviewId);
    if (!state) return;

    clearSilenceTimers(interviewId);
    state.hintsUsed++;
    await saveSession(interviewId, state);

    socket.emit('interview:hint_count', { hintsUsed: state.hintsUsed });
    socket.emit('interview:typing', true);
    let hint = '';

    // Build hint context with coding problem if available
    let hintSystemPrompt = getSystemPrompt(state) + '\nThe candidate is stuck and needs a hint. Give a SMALL directional hint — NOT the solution. Point them in the right direction without solving it.';
    if (state.stage === 'DSA_ROUND' && state.codingProblem?.hints?.length) {
      const hintIdx = Math.min(state.hintsUsed - 1, state.codingProblem.hints.length - 1);
      hintSystemPrompt += `\nAvailable hint for this problem: "${state.codingProblem.hints[hintIdx]}" — rephrase this naturally as if you just thought of it, don't reveal too much.`;
    }

    await aiService.generateStream({
      messages: [
        { role: 'system', content: hintSystemPrompt },
        ...state.transcript.slice(-6).map(m => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.5,
      maxTokens: 150,
    }, (chunk) => {
      if (!chunk.isDone) {
        hint += chunk.content;
        socket.emit('interview:ai_chunk', { content: chunk.content });
      } else {
        socket.emit('interview:ai_done', { fullMessage: hint });
        socket.emit('interview:typing', false);
        state.transcript.push({ role: 'assistant', content: hint, timestamp: Date.now(), stage: state.stage });
        saveSession(interviewId, state);
        startSilenceWatchdog(interviewId, state, socket, io);
      }
    });
  });
}
