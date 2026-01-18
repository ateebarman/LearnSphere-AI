import asyncHandler from 'express-async-handler';
import { searchYouTube } from '../services/youtubeService.js';
import { getArticlesFromAI } from '../services/geminiService.js';

// @desc    Fetch YouTube & AI-generated resources for a topic
// @route   GET /api/resources/:topic
// @access  Private
const getResources = asyncHandler(async (req, res) => {
  const { topic } = req.params;

  // Fetch in parallel
  const [videos, aiResources] = await Promise.all([
    searchYouTube(topic),
    getArticlesFromAI(topic),
  ]);

  const allResources = [
    ...videos,
    ...(aiResources.resources || []),
  ];

  res.json(allResources);
});

export { getResources };