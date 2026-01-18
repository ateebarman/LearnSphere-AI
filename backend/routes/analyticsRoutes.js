import express from 'express';
import { getAnalytics, getRoadmapStats, getQuizStats } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAnalytics);
router.get('/roadmaps', protect, getRoadmapStats);
router.get('/quizzes', protect, getQuizStats);

export default router;