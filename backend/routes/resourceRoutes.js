import express from 'express';
import { getResources } from '../controllers/resourceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:topic', protect, getResources);

export default router;