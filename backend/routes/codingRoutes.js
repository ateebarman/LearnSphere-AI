import express from 'express';
import { 
  generateQuestions, 
  runCode, 
  submitCode, 
  getProgress,
  getAnalytics,
  getProblems,
  getProblemBySlug,
  getSubmissions,
  triggerAiGeneration
} from '../controllers/codingController.js';
import { protect } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 submissions per minute
  message: 'Too many submissions, please try again after a minute.',
});

const router = express.Router();

router.get('/problems', protect, getProblems);
router.get('/problems/:slug', protect, getProblemBySlug);
router.post('/generate', protect, generateQuestions);
router.post('/generate-ai', protect, triggerAiGeneration);
router.post('/run', protect, submissionLimiter, protect, runCode);
router.post('/submit', protect, submissionLimiter, protect, submitCode);
router.get('/progress', protect, getProgress);
router.get('/analytics', protect, getAnalytics);
router.get('/submissions/:questionId', protect, getSubmissions);

export default router;
