import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  // Dashboard
  getAdminStats,
  // Problems
  getAdminProblems,
  createProblem,
  deleteProblem,
  aiGenerateProblem,
  validateProblem,
  // Knowledge
  getAdminKnowledge,
  createKnowledge,
  aiGenerateKnowledge,
  deleteKnowledge,
  // Roadmaps
  getAdminRoadmaps,
  createAdminRoadmap,
  aiGenerateRoadmap,
  deleteRoadmap,
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, admin);

// Dashboard
router.get('/stats', getAdminStats);

// Problem Management
router.get('/problems', getAdminProblems);
router.post('/problems', createProblem);
router.delete('/problems/:id', deleteProblem);
router.post('/problems/ai-generate', aiGenerateProblem);
router.post('/problems/validate', validateProblem);

// Knowledge Base Management
router.get('/knowledge', getAdminKnowledge);
router.post('/knowledge', createKnowledge);
router.post('/knowledge/ai-generate', aiGenerateKnowledge);
router.delete('/knowledge/:id', deleteKnowledge);

// Roadmap Management
router.get('/roadmaps', getAdminRoadmaps);
router.post('/roadmaps', createAdminRoadmap);
router.post('/roadmaps/ai-generate', aiGenerateRoadmap);
router.delete('/roadmaps/:id', deleteRoadmap);

export default router;
