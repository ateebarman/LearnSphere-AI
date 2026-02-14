import asyncHandler from 'express-async-handler';
import KnowledgeNode from '../models/knowledgeModel.js';

// @desc    Get all knowledge topics, optionally filtered by category
// @route   GET /api/knowledge
// @access  Private
export const getKnowledgeNodes = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = category && category !== 'All' ? { category } : {};
  
  const nodes = await KnowledgeNode.find(filter)
    .select('topic category summary complexity')
    .sort({ topic: 1 });
    
  res.json(nodes);
});

// @desc    Get detailed content for a specific topic
// @route   GET /api/knowledge/:topic
// @access  Private
export const getKnowledgeDetails = asyncHandler(async (req, res) => {
  const { topic } = req.params;
  
  const node = await KnowledgeNode.findOne({ topic });
  
  if (!node) {
    res.status(404);
    throw new Error('Knowledge topic not found');
  }
  
  res.json(node);
});

// @desc    Get all unique categories
// @route   GET /api/knowledge/categories
// @access  Private
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await KnowledgeNode.distinct('category');
  res.json(categories);
});
