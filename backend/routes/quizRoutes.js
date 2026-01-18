import express from 'express';
import { generateQuiz, submitQuiz } from '../controllers/quizController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateQuizGenerate, validateQuizSubmit } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/generate', protect, validateQuizGenerate, generateQuiz);
router.post('/submit', protect, validateQuizSubmit, submitQuiz);

export default router;