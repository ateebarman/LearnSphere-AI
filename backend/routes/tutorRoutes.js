import express from 'express';
import { handleTutorChat } from '../controllers/tutorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/tutor - Send message to tutor (protected)
router.post('/', protect, handleTutorChat);

export default router;
