import express from 'express';
import Interview from '../models/interviewModel.js';
import User from '../models/userModel.js';
import { protect } from '../middleware/authMiddleware.js';
import { aiService } from '../services/interviewService.js';
import { DSA_PROBLEM_PROMPT, STUDY_PLAN_PROMPT } from '../services/interviewPrompts.js';

const router = express.Router();

// Judge0 CE free public instance (no API key required)
const JUDGE0_BASE = process.env.JUDGE0_BASE_URL || 'https://ce.judge0.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || null;

// Judge0 language IDs
const LANGUAGE_IDS = {
  javascript: 63,  // Node.js 12.14.0
  python:     71,  // Python 3.8.1
  java:       62,  // Java OpenJDK 13.0.1
  cpp:        54,  // C++ GCC 9.2.0
  typescript: 74,  // TypeScript 3.7.4
};

// POST /api/interview/start
router.post('/start', protect, async (req, res) => {
  try {
    const { mode, company, targetRole, topic, difficulty, voiceMode } = req.body;
    const userId = req.user._id || req.user.id;

    const interview = new Interview({
      candidateId: userId,
      mode: mode || 'mock',
      company: company || 'generic',
      targetRole: targetRole || 'Software Engineer',
      topic,
      difficulty: difficulty || 'adaptive',
      status: 'ONGOING',
      metadata: { voiceMode: voiceMode ?? true },
    });

    await interview.save();
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.interviewsCount': 1 } });

    res.status(201).json({ success: true, interviewId: interview._id, interview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/interview/history
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const interviews = await Interview.find({ candidateId: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-transcript -codingProblem'); // include evaluation but skip large fields
    res.json({ success: true, interviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/interview/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    res.json({ success: true, interview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/interview/:id/generate-problem
router.post('/:id/generate-problem', protect, async (req, res) => {
  try {
    const { topic, difficulty, company } = req.body;
    const problem = await aiService.generateStructuredResponse({
      messages: [{
        role: 'user',
        content: DSA_PROBLEM_PROMPT(topic || 'Arrays', difficulty || 'medium', company || 'generic')
      }],
      temperature: 0.4,
      maxTokens: 1500,
    });

    await Interview.findByIdAndUpdate(req.params.id, { codingProblem: problem });
    res.json({ success: true, problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/interview/:id/complete
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const { evaluation } = req.body;
    const userId = req.user._id || req.user.id;

    const interview = await Interview.findByIdAndUpdate(
      req.params.id,
      { status: 'COMPLETED', evaluation, stage: 'END' },
      { new: true }
    );

    if (evaluation?.overallScore) {
      const user = await User.findById(userId);
      if (user) {
        const count = Math.max(user.stats?.interviewsCount || 1, 1);
        const currentAvg = user.stats?.averageScore || 0;
        const newAvg = ((currentAvg * (count - 1)) + evaluation.overallScore) / count;
        await User.findByIdAndUpdate(userId, {
          'stats.averageScore': Math.round(newAvg * 10) / 10
        });
      }
    }

    res.json({ success: true, interview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/interview/:id/study-plan — generate personalized study plan
router.post('/:id/study-plan', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id).select('evaluation targetRole');
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    if (!interview.evaluation) return res.status(400).json({ success: false, message: 'Interview not yet evaluated' });

    const plan = await aiService.generateStructuredResponse({
      messages: [{
        role: 'user',
        content: STUDY_PLAN_PROMPT(interview.evaluation, interview.targetRole || 'Software Engineer'),
      }],
      temperature: 0.4,
      maxTokens: 2000,
    });

    res.json({ success: true, studyPlan: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/interview/execute-code — run code via Judge0 CE
router.post('/execute-code', protect, async (req, res) => {
  try {
    const { code, language, stdin = '' } = req.body;

    if (!code || !language) {
      return res.status(400).json({ success: false, error: 'Code and language are required' });
    }

    const languageId = LANGUAGE_IDS[language];
    if (!languageId) {
      return res.status(400).json({ success: false, error: `Unsupported language: ${language}` });
    }

    // Submit to Judge0
    const submitHeaders = {
      'Content-Type': 'application/json',
    };
    if (JUDGE0_API_KEY) {
      submitHeaders['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
      submitHeaders['X-RapidAPI-Key'] = JUDGE0_API_KEY;
    }

    const submitRes = await fetch(`${JUDGE0_BASE}/submissions?base64_encoded=false&wait=false`, {
      method: 'POST',
      headers: submitHeaders,
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
        stdin,
        cpu_time_limit: 5,
        memory_limit: 256000,
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      throw new Error(`Judge0 submission failed: ${submitRes.status} — ${errText}`);
    }

    const { token } = await submitRes.json();
    if (!token) throw new Error('No submission token received from Judge0');

    // Poll for result (max 10 attempts × 1s = 10s timeout)
    let result = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 1000));

      const pollRes = await fetch(`${JUDGE0_BASE}/submissions/${token}?base64_encoded=false`, {
        headers: submitHeaders,
      });

      if (pollRes.ok) {
        const data = await pollRes.json();
        // status.id: 1=In Queue, 2=Processing, 3=Accepted, 4=Wrong Answer, 5=Time Limit, 6=Compilation Error, ...
        if (data.status?.id > 2) {
          result = data;
          break;
        }
      }
    }

    if (!result) {
      return res.json({ success: false, error: 'Execution timed out', output: 'Code execution timed out (10s limit exceeded)' });
    }

    const statusId = result.status?.id;
    const output = result.stdout || result.stderr || result.compile_output || result.message || '';
    const isSuccess = statusId === 3; // Accepted

    res.json({
      success: true,
      output: output.trim(),
      statusId,
      statusDescription: result.status?.description || 'Unknown',
      passed: isSuccess,
      time: result.time,
      memory: result.memory,
      compileOutput: result.compile_output || null,
      stderr: result.stderr || null,
    });
  } catch (error) {
    console.error('Code execution error:', error.message);
    res.status(500).json({ success: false, error: error.message, output: `Error: ${error.message}` });
  }
});

export default router;
