import express from 'express';
import Interview from '../models/interviewModel.js';
import User from '../models/userModel.js';
import { protect } from '../middleware/authMiddleware.js';
import { aiService } from '../services/interviewService.js';
import { DSA_PROBLEM_PROMPT } from '../services/interviewPrompts.js';

const router = express.Router();

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
      .select('-transcript');
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

export default router;
