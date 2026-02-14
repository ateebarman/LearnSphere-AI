import asyncHandler from 'express-async-handler';
import Roadmap from '../models/roadmapModel.js';
import KnowledgeNode from '../models/knowledgeModel.js';
import { generateRoadmapFromAI, generateRoadmapFromRAG } from '../services/geminiService.js';
import { getRelevantContext } from '../services/ragService.js';


// @desc    Generate a new roadmap
// @route   POST /api/roadmaps
// @access  Private
const generateRoadmap = asyncHandler(async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    res.status(400);
    throw new Error('Please provide a topic');
  }

  // 1. Get roadmap structure from Gemini (already contains YouTube videos)
  const aiRoadmap = await generateRoadmapFromAI(topic);

  // 2. Save to database
  const roadmap = new Roadmap({
    user: req.user._id,
    title: aiRoadmap.title || `Learning ${topic}`,
    topic: topic,
    description: aiRoadmap.description || `A personalized roadmap for ${topic}`,
    modules: aiRoadmap.modules,
    difficulty: aiRoadmap.difficulty,
    totalDuration: aiRoadmap.totalDuration
  });

  const createdRoadmap = await roadmap.save();
  res.status(201).json(createdRoadmap);
});

// @desc    Generate a RAG-based roadmap
// @route   POST /api/roadmaps/rag
// @access  Private
const generateRAGRoadmap = asyncHandler(async (req, res) => {
  const { topic, materialId } = req.body;
  console.log(`🤖 RAG Request: Topic="${topic}", MaterialId=${materialId}`);

  if (!topic || !materialId) {
    res.status(400);
    throw new Error('Please provide a topic and material ID');
  }

  // 1. Get relevant context from Vector Store
  console.log('🔍 Fetching context from vector store...');
  const context = await getRelevantContext(topic, req.user._id, materialId);
  
  if (!context) {
    console.error('❌ No context found for this topic in vectors.');
    res.status(400);
    throw new Error('Could not find relevant context in your study material. Try a different topic or ensure the PDF content is searchable.');
  }

  console.log(`✅ Found context (${context.length} chars). Generating roadmap...`);

  // 2. Generate roadmap based on context (already contains YouTube videos)
  const aiRoadmap = await generateRoadmapFromRAG(topic, context);

  // 3. Save to DB
  const roadmap = new Roadmap({
    user: req.user._id,
    title: aiRoadmap.title || `Learning ${topic} (from material)`,
    topic: topic,
    description: aiRoadmap.description,
    modules: aiRoadmap.modules,
    sourceMaterial: materialId,
    difficulty: aiRoadmap.difficulty
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
      // HYPER-LINK INTEGRATION: Deep link modules to Knowledge Base
      const modulesWithDocs = await Promise.all(roadmap.modules.map(async (module) => {
        const existingInternalUrls = module.resources
          .filter(r => r.type === 'doc' && r.url.includes('/library'))
          .map(r => r.url);

        // Build a search query based on title and key concepts
        const searchTerms = [
          module.title,
          ...(module.keyConcepts || [])
        ].filter(t => t && t.length > 3);

        if (searchTerms.length === 0) return module;

        // Find relevant internal documents using a single combined regex
        const searchRegex = new RegExp(searchTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
        
        const internalDocs = await KnowledgeNode.find({
          $or: [
            { topic: searchRegex },
            { category: searchRegex },
            ...searchTerms.map(term => ({
              topic: { $regex: term.split(' ')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
            }))
          ]
        }).select('topic category').limit(3);

        internalDocs.forEach(doc => {
          const docUrl = `/library?topic=${encodeURIComponent(doc.topic)}`;
          if (!existingInternalUrls.includes(docUrl)) {
            module.resources.push({
              title: `Internal Doc: ${doc.topic}`,
              type: 'doc',
              url: docUrl,
              description: `Deep dive into ${doc.topic} from our official knowledge base.`,
            });
            existingInternalUrls.push(docUrl);
          }
        });

        return module;
      }));

      roadmap.modules = modulesWithDocs;
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

export { 
  generateRoadmap, 
  generateRAGRoadmap,
  getRoadmapById, 
  getUserRoadmaps, 
  getPublicRoadmaps, 
  toggleRoadmapVisibility, 
  cloneRoadmap 
};
