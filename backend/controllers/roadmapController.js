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
    // Check if user is owner
    const isOwner = roadmap.user.toString() === req.user._id.toString();
    
    // Allow if owner or if roadmap is public
    if (isOwner || roadmap.isPublic) {
      res.json(roadmap);
    } else {
      res.status(403);
      throw new Error('Not authorized to view this roadmap');
    }
  } else {
    res.status(404);
    throw new Error('Roadmap not found');
  }
});

// @desc    Get all public roadmaps
// @route   GET /api/roadmaps/public/list
// @access  Public
const getPublicRoadmaps = asyncHandler(async (req, res) => {
  const roadmaps = await Roadmap.find({ isPublic: true })
    .select('-modules -progress')
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  
  res.json({ roadmaps });
});

// @desc    Toggle roadmap visibility (Public/Private)
// @route   PUT /api/roadmaps/:id/visibility
// @access  Private
const toggleRoadmapVisibility = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findById(req.params.id);

  if (!roadmap) {
    res.status(404);
    throw new Error('Roadmap not found');
  }

  // Check if user is owner
  if (roadmap.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to modify this roadmap');
  }

  // Toggle isPublic
  roadmap.isPublic = !roadmap.isPublic;
  const updatedRoadmap = await roadmap.save();

  res.json({ isPublic: updatedRoadmap.isPublic });
});

// @desc    Clone a public roadmap
// @route   POST /api/roadmaps/:id/clone
// @access  Private
const cloneRoadmap = asyncHandler(async (req, res) => {
  const sourceRoadmap = await Roadmap.findById(req.params.id);

  if (!sourceRoadmap) {
    res.status(404);
    throw new Error('Roadmap not found');
  }

  // Check if roadmap is public or if user is owner
  const isOwner = sourceRoadmap.user.toString() === req.user._id.toString();
  if (!sourceRoadmap.isPublic && !isOwner) {
    res.status(403);
    throw new Error('Cannot clone private roadmaps');
  }

  // Create new roadmap with cloned content
  const clonedRoadmap = new Roadmap({
    user: req.user._id,
    title: `${sourceRoadmap.title} (Clone)`,
    topic: sourceRoadmap.topic,
    description: sourceRoadmap.description,
    modules: sourceRoadmap.modules.map(module => ({
      title: module.title,
      description: module.description,
      estimatedTime: module.estimatedTime,
      resources: module.resources.map(resource => ({
        title: resource.title,
        type: resource.type,
        url: resource.url,
        description: resource.description,
      })),
      isCompleted: false,
    })),
    progress: 0,
    isPublic: false, // Cloned roadmaps are private by default
  });

  const savedRoadmap = await clonedRoadmap.save();
  res.status(201).json({ roadmapId: savedRoadmap._id });
});

export { generateRoadmap, getRoadmapById, getUserRoadmaps, getPublicRoadmaps, toggleRoadmapVisibility, cloneRoadmap };