import express from 'express';
import {
  generateRoadmap,
  getRoadmapById,
  getUserRoadmaps,
} from '../controllers/roadmapController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRoadmap } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.route('/').post(protect, validateRoadmap, generateRoadmap).get(protect, getUserRoadmaps);
router.route('/:id').get(protect, getRoadmapById);

export default router;