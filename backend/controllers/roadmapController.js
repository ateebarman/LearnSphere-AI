import asyncHandler from 'express-async-handler';
import Roadmap from '../models/roadmapModel.js';
import { generateRoadmapFromAI } from '../services/geminiService.js';
import { searchYouTube } from '../services/youtubeService.js';

// @desc    Generate a new roadmap
// @route   POST /api/roadmaps
// @access  Private
const generateRoadmap = asyncHandler(async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    res.status(400);
    throw new Error('Please provide a topic');
  }

  // 1. Get roadmap structure from Gemini
  const aiRoadmap = await generateRoadmapFromAI(topic);

  // 2. Enhance modules with YouTube videos
  const enhancedModules = await Promise.all(
    aiRoadmap.modules.map(async (module) => {
      const videos = await searchYouTube(`${module.title} ${topic}`);
      // Add AI-generated resources and YouTube videos together
      const allResources = [
        ...module.resources,
        ...videos.map((v) => ({ ...v, type: 'video' })),
      ];
      return { ...module, resources: allResources };
    })
  );

  // 3. Save to database
  const roadmap = new Roadmap({
    user: req.user._id,
    title: aiRoadmap.title || `Learning ${topic}`,
    topic: topic,
    description: aiRoadmap.description || `A personalized roadmap for ${topic}`,
    modules: enhancedModules,
  });

  const createdRoadmap = await roadmap.save();
  res.status(201).json(createdRoadmap);
});

// @desc    Get user's roadmaps
// @route   GET /api/roadmaps
// @access  Private
const getUserRoadmaps = asyncHandler(async (req, res) => {
  const roadmaps = await Roadmap.find({ user: req.user._id });
  res.json(roadmaps);
});

// @desc    Get roadmap by ID
// @route   GET /api/roadmaps/:id
// @access  Private
const getRoadmapById = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findById(req.params.id);

  if (roadmap) {
    // Check if roadmap belongs to the user
    if (roadmap.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }
    res.json(roadmap);
  } else {
    res.status(404);
    throw new Error('Roadmap not found');
  }
});

export { generateRoadmap, getRoadmapById, getUserRoadmaps };