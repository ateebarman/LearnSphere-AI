import asyncHandler from 'express-async-handler';
import KnowledgeNode from '../models/knowledgeModel.js';
import { getFromCache, setInCache } from '../utils/cache.js';

// @desc    Get all knowledge topics, optionally filtered by category
// @route   GET /api/knowledge
// @access  Private
export const getKnowledgeNodes = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const cacheKey = category && category !== 'All' ? `knowledge:cat:${category}` : `knowledge:all`;

  // Check cache
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const filter = category && category !== 'All' ? { category } : {};
  
  const nodes = await KnowledgeNode.find(filter)
    .select('topic category summary complexity')
    .sort({ topic: 1 })
    .lean(); // Faster read (no mongoose documents)
    
  // Set cache (1 hour)
  await setInCache(cacheKey, nodes, 3600);
  res.json(nodes);
});

// @desc    Get detailed content for a specific topic
// @route   GET /api/knowledge/:topic
// @access  Private
export const getKnowledgeDetails = asyncHandler(async (req, res) => {
  const { topic } = req.params;
  
  // Cache individual detail pages
  const cacheKey = `knowledge:detail:${topic}`;
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
      return res.json(cachedData); 
  }

  const node = await KnowledgeNode.findOne({ topic }).lean();
  
  if (!node) {
    res.status(404);
    throw new Error('Knowledge topic not found');
  }
  
  // Set cache (1 hour)
  await setInCache(cacheKey, node, 3600);
  res.json(node);
});

// @desc    Get all unique categories
// @route   GET /api/knowledge/categories
// @access  Private
export const getCategories = asyncHandler(async (req, res) => {
  const cacheKey = 'knowledge:categories';
  
  const cachedData = await getFromCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const categories = await KnowledgeNode.distinct('category');
  
  // Set cache (24 hours - categories rarely change)
  await setInCache(cacheKey, categories, 86400);
  res.json(categories);
});
