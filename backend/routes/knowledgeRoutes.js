import express from 'express';
import { 
  getKnowledgeNodes, 
  getKnowledgeDetails, 
  getCategories 
} from '../controllers/knowledgeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getKnowledgeNodes);
router.get('/categories', protect, getCategories);
router.get('/:topic', protect, getKnowledgeDetails);

export default router;
