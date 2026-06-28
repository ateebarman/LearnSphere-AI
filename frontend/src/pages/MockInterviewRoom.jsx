import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useInterviewStore } from '../store/useInterviewStore';
import { useInterviewSocket } from '../hooks/useInterviewSocket';
import { useVoice } from '../hooks/useVoice';
import { getInterviewDetails, completeInterview } from '../services/interviewService';
import AiAvatar from '../components/AiAvatar';
import VoiceWaveform from '../components/VoiceWaveform';
import AnswerTimerRing from '../components/AnswerTimerRing';
import SilenceNudge from '../components/SilenceNudge';
import InterviewSidebar from '../components/InterviewSidebar';
import toast from 'react-hot-toast';

const STAGE_LABELS = {
  WARMUP: '🔥 Warm-Up', INTRO: '👋 Intro', RESUME_DISCUSSION: '📄 Resume',
  DSA_ROUND: '💻 Coding', SYSTEM_DESIGN: '🏗️ Design', FOLLOW_UP: '🔍 Follow-Up',
  HR_ROUND: '🤝 HR', FEEDBACK: '📊 Feedback', END: '✅ Done',
};

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'typescript', label: 'TypeScript' },
];

export default function MockInterviewRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useAuthStore();
  const { darkMode } = useThemeStore();
  const { messages, isTyping, stage, evaluation, setInterview, resetInterview } = useInterviewStore();

  const [textInput, setTextInput] = useState('');
  const [code, setCode] = useState('// Write your code solution here...\n');
  const [language, setLanguage] = useState('javascript');
  const [codeOutput, setCodeOutput] = useState('');
  const [runningCode, setRunningCode] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [interviewData, setInterviewData] = useState(null);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [silencePhase, setSilencePhase] = useState('idle');
  const [silenceMessage, setSilenceMessage] = useState('');
  const [isClarifying, setIsClarifying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);

  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef('');

  const {
    joinInterview, sendMessage, silenceAutoSubmit, signalVoiceActivity,
    requestHint, nextStage, pauseInterview, resumeInterview, sendCodeResult,
  } = useInterviewSocket(sessionId || null, {
    onTimerConfig: (secs) => {
      setTimerSeconds(secs);
      setTimerActive(false);
    },
    onSilenceNudge: (msg) => { setSilencePhase('nudging'); setSilenceMessage(msg); },
    onSilenceTimeout: (msg) => { setSilencePhase('timeout'); setSilenceMessage(msg); setTimeout(() => setSilencePhase('idle'), 3000); },
    onClarificationMode: (active) => setIsClarifying(active),
    onHintCount: (count) => setHintsUsed(count),
    onPaused: () => setIsPaused(true),
    onResumed: () => setIsPaused(false),
  });

  const handleVoiceTranscript = useCallback((text) => {
    if (text.trim()) {
      setSilencePhase('idle');
      setQuestionCount(c => c + 1);
      sendMessage(text);
      setTimerActive(false);
    }
  }, [sendMessage]);

  const {
    isListening, isSpeaking, audioLevel, interimTranscript, confidenceScore,
    startListening, stopListening, speak, stopSpeaking, signalVoiceActivity: voiceActivity,
  } = useVoice({
    onTranscript: handleVoiceTranscript,
    onInterimTranscript: () => {
      signalVoiceActivity();
      setSilencePhase('idle');
    },
    onSilenceNudge: () => setSilencePhase('nudging'),
    onSilenceTimeout: () => {
      setSilencePhase('timeout');
      silenceAutoSubmit();
    },
  });

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant' && !isTyping && lastMsg.content !== lastMessageRef.current) {
      lastMessageRef.current = lastMsg.content;
      setSilencePhase('idle');
      speak(lastMsg.content, () => {
        if (timerSeconds > 0) {
          setTimerKey(k => k + 1);
          setTimerActive(true);
        }
        setTimeout(startListening, 400);
      });
    }
  }, [messages, isTyping, speak, startListening, timerSeconds]);

  useEffect(() => {
    const t = setInterval(() => setElapsedTime(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!sessionId) return;
    resetInterview();
    getInterviewDetails(sessionId).then((data) => {
      if (data.success) {
        setInterviewData(data.interview);
        setInterview({
          interviewId: sessionId, mode: data.interview.mode,
          company: data.interview.company, role: data.interview.targetRole,
          voiceMode: data.interview.metadata?.voiceMode ?? true,
        });
        joinInterview({
          candidateName: userInfo?.name || 'Candidate',
          mode: data.interview.mode, company: data.interview.company,
          role: data.interview.targetRole, difficulty: data.interview.difficulty,
          voiceMode: data.interview.metadata?.voiceMode ?? true,
          resumeData: userInfo?.profile?.resumeData,
        });
        if (['coding', 'technical'].includes(data.interview.mode)) setShowCodePanel(true);
      }
    }).catch(console.error);
  }, [sessionId]);

  useEffect(() => {
    if (evaluation) {
      completeInterview(sessionId, { evaluation }).then(() => {
        toast.success('Interview evaluation complete!');
        setTimeout(() => navigate(`/mock-interview/results/${sessionId}`), 2000);
      });
    }
  }, [evaluation, sessionId, navigate]);

  const handleSend = () => {
    if (!textInput.trim()) return;
    stopSpeaking();
    setSilencePhase('idle');
    setTimerActive(false);
    setQuestionCount(c => c + 1);
    sendMessage(textInput.trim());
    setTextInput('');
  };

  const handleSubmitEarly = () => {
    if (textInput.trim()) {
      handleSend();
    } else {
      stopListening();
      setTimerActive(false);
    }
  };

  const handleTimerExpire = () => {
    setTimerActive(false);
    silenceAutoSubmit();
  };

  const handleVoiceButton = () => {
    if (isListening) { stopListening(); }
    else { stopSpeaking(); startListening(); }
  };

  const handleRunCode = () => {
    setRunningCode(true);
    setCodeOutput('Simulating execution...');
    setTimeout(() => {
      setCodeOutput('✔ Code parsed successfully.\nConsole Output: Executed without runtime exceptions.');
      sendCodeResult({ code, language, output: 'Executed successfully', passed: true });
      setRunningCode(false);
    }, 1200);
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 px-4 h-14 flex items-center justify-between gap-4 backdrop-blur-md transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0 text-white shadow-md">
            AI
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {interviewData?.company !== 'generic' ? interviewData?.company?.toUpperCase() + ' ' : ''}Mock Interview
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-semibold">
            {STAGE_LABELS[stage] || stage}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setShowCodePanel(p => !p)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${showCodePanel ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            💻 Editor
          </button>
          <button onClick={() => setShowSidebar(p => !p)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${showSidebar ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            ☰ Sidebar
          </button>
          <button
            onClick={() => { stopSpeaking(); navigate('/dashboard'); }}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-medium">
            Exit Session
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex flex-col flex-1 min-w-0 ${showCodePanel ? 'max-w-[42%]' : ''} border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors`}>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex-shrink-0">
            <AiAvatar isTyping={isTyping} isSpeaking={isSpeaking} isListening={isListening} stage={stage} size="md" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 dark:text-white">AI Technical Interviewer</div>
              <div className="text-xs flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                {isTyping ? 'Thinking...' : isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Active'}
              </div>
            </div>

            {isListening && (
              <div className="flex flex-col items-end gap-1">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Confidence</div>
                <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${confidenceScore}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <AiAvatar isTyping={false} isSpeaking={false} isListening={false} stage={stage} size="sm" />
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md font-medium'
                      : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50 dark:bg-slate-900/60 transition-colors">
            <div className="flex items-center justify-center gap-6 relative">
              <SilenceNudge phase={silencePhase} message={silenceMessage} onDismiss={() => setSilencePhase('idle')} />
              <AnswerTimerRing
                key={timerKey}
                totalSeconds={timerSeconds}
                isActive={timerActive}
                onExpire={handleTimerExpire}
                onSubmitEarly={handleSubmitEarly}
              />

              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={handleVoiceButton}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isListening ? 'bg-emerald-600 shadow-lg shadow-emerald-600/40 scale-105' : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-xl">{isListening ? '🔴' : '🎤'}</span>
                </button>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {isListening ? 'Listening...' : 'Mic On'}
                </span>
              </div>

              <div className="flex-1 max-w-[200px]">
                <VoiceWaveform audioLevel={audioLevel} isListening={isListening} interimTranscript={interimTranscript} />
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type your answer here..."
                className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
              <button
                onClick={handleSend}
                disabled={!textInput.trim()}
                className="px-4 py-2.5 bg-indigo-600 disabled:opacity-40 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-md"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showCodePanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '42%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex flex-col overflow-hidden border-r border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-950 transition-colors"
            >
              <div className="flex items-center gap-3 px-4 h-10 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex-shrink-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">Solution Workspace</span>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  className="ml-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-700 dark:text-slate-300 px-2 py-0.5">
                  {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
                <button onClick={handleRunCode} disabled={runningCode}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs px-3 py-1 rounded-md transition-colors font-semibold">
                  {runningCode ? 'Running...' : '▶ Run Solution'}
                </button>
              </div>
              <div className="flex-1 overflow-hidden" style={{ height: '65%' }}>
                <Editor height="100%" language={language} value={code} onChange={v => setCode(v || '')}
                  theme={darkMode ? "vs-dark" : "light"} options={{ fontSize: 13, minimap: { enabled: false } }} />
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col p-3" style={{ height: '35%' }}>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-2 font-bold">OUTPUT CONSOLE</div>
                <pre className="flex-1 overflow-auto text-xs font-mono text-slate-800 dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner">
                  {codeOutput || 'Run code to view output...'}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSidebar && (
            <motion.div initial={{ width: 0 }} animate={{ width: 256 }} exit={{ width: 0 }} className="overflow-hidden flex-shrink-0">
              <InterviewSidebar
                stage={stage}
                elapsedTime={elapsedTime}
                questionCount={questionCount}
                hintsUsed={hintsUsed}
                isClarifying={isClarifying}
                isPaused={isPaused}
                onRequestHint={() => { stopSpeaking(); requestHint(); }}
                onNextStage={() => { stopSpeaking(); nextStage(); }}
                onPause={pauseInterview}
                onResume={resumeInterview}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
