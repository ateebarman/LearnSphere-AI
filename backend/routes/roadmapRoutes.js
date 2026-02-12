import express from 'express';
import {
  generateRoadmap,
  generateRAGRoadmap,
  getRoadmapById,
  getUserRoadmaps,
  getPublicRoadmaps,
  toggleRoadmapVisibility,
  cloneRoadmap,
} from '../controllers/roadmapController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRoadmap } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public roadmaps listing (no auth required)
router.get('/public/list', getPublicRoadmaps);

// User's roadmaps and generate new one
router.route('/').post(protect, validateRoadmap, generateRoadmap).get(protect, getUserRoadmaps);

// Generate RAG-based roadmap
router.post('/rag', protect, generateRAGRoadmap);


// Roadmap details (protected - can view own or public)
router.get('/:id', protect, getRoadmapById);

// Toggle visibility (protected - owner only)
router.put('/:id/visibility', protect, toggleRoadmapVisibility);

// Clone roadmap (protected)
router.post('/:id/clone', protect, cloneRoadmap);

export default router;