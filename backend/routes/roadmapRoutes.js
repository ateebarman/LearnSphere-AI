import express from 'express';
import {
  getRoadmapPreview,
  createRoadmap,
  generateRoadmap,
  generateRAGRoadmap,
  getRoadmapById,
  getUserRoadmaps,
  getPublicRoadmaps,
  toggleRoadmapVisibility,
  cloneRoadmap,
  updateRoadmap,
  deleteRoadmap,
} from '../controllers/roadmapController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRoadmap } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public roadmaps listing (no auth required)
router.get('/public/list', getPublicRoadmaps);

// User's roadmaps and generate new one
router.post('/preview', protect, getRoadmapPreview);
router.post('/direct', protect, generateRoadmap);
router.route('/').post(protect, validateRoadmap, createRoadmap).get(protect, getUserRoadmaps);

// Generate RAG-based roadmap
router.post('/rag', protect, generateRAGRoadmap);


// Roadmap details (protected - can view own or public)
router.route('/:id')
  .get(protect, getRoadmapById)
  .put(protect, updateRoadmap)
  .delete(protect, deleteRoadmap);

// Toggle visibility (protected - owner only)
router.put('/:id/visibility', protect, toggleRoadmapVisibility);

// Clone roadmap (protected)
router.post('/:id/clone', protect, cloneRoadmap);

export default router;