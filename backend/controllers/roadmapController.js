import asyncHandler from 'express-async-handler';
import Roadmap from '../models/roadmapModel.js';
import KnowledgeNode from '../models/knowledgeModel.js';
import CodingQuestion from '../models/codingQuestionModel.js';
import { generateRoadmapFromAI, generateRoadmapFromRAG } from '../services/geminiService.js';
import { getRelevantContext } from '../services/ragService.js';
import { generateJson } from '../services/ai/index.js';
import { searchYouTubeVideos } from '../services/youtubeService.js';
import { getResourcesForTopic } from '../services/resourceDatabase.js';


// @desc    Get an AI roadmap preview (not saved)
// @route   POST /api/roadmaps/preview
// @access  Private
const getRoadmapPreview = asyncHandler(async (req, res) => {
  const { topic, difficulty, targetRole } = req.body;
  if (!topic) {
    res.status(400);
    throw new Error('Topic is required');
  }

  const prompt = `
    You are a World-Class Educational Architect and Career Coach creating an intelligent learning roadmap.
    Generate a comprehensive, structured roadmap for: "${topic}"
    ${difficulty ? `Target difficulty: ${difficulty}` : ''}
    ${targetRole ? `Target role: ${targetRole}` : ''}

    Return a JSON object with ALL fields filled:
    {
      "title": "Mastering ${topic}",
      "topic": "${topic}",
      "description": "A comprehensive, interview-focused learning path... (2-3 sentences)",
      "difficulty": "${difficulty || 'Intermediate'}",
      "totalDuration": "X Weeks",
      "learningGoals": ["Goal 1: ...", "Goal 2: ...", "Goal 3: ...", "Goal 4: ..."],
      "targetRoles": ["SDE-1", "Backend Engineer", ...],
      "expectedOutcomes": ["Outcome 1: ...", "Outcome 2: ...", "Outcome 3: ..."],
      "skillsCovered": ["Skill1", "Skill2", "Skill3", ...],
      "tags": ["tag1", "tag2", "tag3", ...],
      "prerequisites": ["Prerequisite 1", "Prerequisite 2", ...],
      "modules": [
        {
          "title": "Module Title",
          "description": "3-4 sentences on what this module covers and why",
          "estimatedTime": "X hours",
          "difficulty": "Beginner" | "Intermediate" | "Advanced",
          "objectives": ["Objective 1", "Objective 2", "Objective 3", "Objective 4"],
          "keyConcepts": ["Concept 1", "Concept 2", "Concept 3", "Concept 4", "Concept 5"],
          "practiceProblems": [
            { "title": "Problem Name", "url": "https://leetcode.com/problems/...", "difficulty": "Easy" | "Medium" | "Hard", "source": "external" }
          ],
          "learningResources": [
            { "title": "Official Documentation", "url": "https://real-url.com/docs", "type": "doc", "source": "external" }
          ],
          "quizConfig": { "autoGenerate": true, "topic": "Module-specific topic", "questionCount": 5 },
          "effortEstimate": { "readingMinutes": 30, "practiceMinutes": 45, "assessmentMinutes": 15 },
          "interviewImportance": "Critical" | "High" | "Medium" | "Low",
          "conceptWeight": 1-10,
          "unlockCriteria": { "masteryThreshold": 60, "quizScore": 70, "problemsSolved": 2 }
        }
      ]
    }
    Return ONLY valid JSON.
  `;

  const data = await generateJson(prompt);

  // Enrichment
  const enrichedModules = await Promise.all(data.modules.map(async (module) => {
    const youtubeVideos = await searchYouTubeVideos(`${module.title} tutorial developer`, 2);
    const staticResources = getResourcesForTopic(module.title);
    
    const internalKnowledge = await KnowledgeNode.find({
      $or: [
        { topic: { $regex: new RegExp(module.title, 'i') } },
        { keywords: { $in: (module.keyConcepts || []).map(k => new RegExp(k, 'i')) } }
      ]
    }).limit(2).select('topic slug summary');

    const internalProblems = await CodingQuestion.find({
      $or: [
        { title: { $regex: new RegExp(module.title, 'i') } },
        { topic: { $in: (module.keyConcepts || []).map(k => k.toLowerCase()) } }
      ]
    }).limit(2).select('title slug difficulty topic');

    return {
      ...module,
      learningResources: [
        ...youtubeVideos,
        ...staticResources.slice(0, 2),
        ...internalKnowledge.map(k => ({ title: `Internal: ${k.topic}`, url: `/knowledge/${k.slug}`, type: 'doc', source: 'internal' })),
        ...(module.learningResources || [])
      ].slice(0, 6),
      practiceProblems: [
        ...internalProblems.map(p => ({ title: `Internal: ${p.title}`, url: `/problems/${p.slug}`, difficulty: p.difficulty, source: 'internal' })),
        ...(module.practiceProblems || [])
      ].slice(0, 4)
    };
  }));

  res.json({ ...data, modules: enrichedModules });
});

const createRoadmap = asyncHandler(async (req, res) => {
  const {
    title, topic, description, difficulty, totalDuration, modules,
    learningGoals, targetRoles, expectedOutcomes, skillsCovered, tags, prerequisites, isPublic
  } = req.body;

  const roadmap = new Roadmap({
    user: req.user._id,
    title, topic, description, difficulty, totalDuration,
    learningGoals: learningGoals || [],
    targetRoles: targetRoles || [],
    expectedOutcomes: expectedOutcomes || [],
    skillsCovered: skillsCovered || [],
    tags: tags || [],
    prerequisites: prerequisites || [],
    isPublic: isPublic || false,
    modules: (modules || []).map((m, i) => ({
      ...m,
      order: i,
      knowledgeRefs: m.knowledgeRefs || [],
      practiceProblems: m.practiceProblems || [],
      learningResources: m.learningResources || [],
      quizConfig: m.quizConfig || { autoGenerate: true, topic: m.title, questionCount: 5 },
      effortEstimate: m.effortEstimate || { readingMinutes: 30, practiceMinutes: 45, assessmentMinutes: 15 },
      unlockCriteria: m.unlockCriteria || { masteryThreshold: 0, quizScore: 0, problemsSolved: 0 },
    }))
  });

  const createdRoadmap = await roadmap.save();
  res.status(201).json(createdRoadmap);
});

// @desc    Generate a new roadmap (Legacy/Direct)
// @route   POST /api/roadmaps/direct
// @access  Private
const generateRoadmap = asyncHandler(async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    res.status(400);
    throw new Error('Please provide a topic');
  }

  const aiRoadmap = await generateRoadmapFromAI(topic);

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
  const roadmap = await Roadmap.findById(req.params.id).populate('user', 'name email avatar');

  if (roadmap) {
    // Check if user is owner
    const isOwner = roadmap.user._id ? roadmap.user._id.toString() === req.user._id.toString() : roadmap.user.toString() === req.user._id.toString();
    
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
    .populate('user', 'name email avatar')
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
    difficulty: sourceRoadmap.difficulty,
    totalDuration: sourceRoadmap.totalDuration,
    learningGoals: sourceRoadmap.learningGoals || [],
    targetRoles: sourceRoadmap.targetRoles || [],
    expectedOutcomes: sourceRoadmap.expectedOutcomes || [],
    skillsCovered: sourceRoadmap.skillsCovered || [],
    tags: sourceRoadmap.tags || [],
    prerequisites: sourceRoadmap.prerequisites || [],
    modules: sourceRoadmap.modules.map(module => ({
      title: module.title,
      description: module.description,
      estimatedTime: module.estimatedTime,
      difficulty: module.difficulty,
      objectives: module.objectives,
      keyConcepts: module.keyConcepts,
      resources: module.resources.map(resource => ({
        title: resource.title,
        type: resource.type,
        url: resource.url,
        description: resource.description,
      })),
      practiceProblems: (module.practiceProblems || []).map(pp => ({
        title: pp.title,
        url: pp.url,
        difficulty: pp.difficulty,
        source: pp.source,
      })),
      learningResources: (module.learningResources || []).map(lr => ({
        title: lr.title,
        url: lr.url,
        type: lr.type,
        source: lr.source,
      })),
      quizConfig: module.quizConfig,
      effortEstimate: module.effortEstimate,
      interviewImportance: module.interviewImportance,
      conceptWeight: module.conceptWeight,
      unlockCriteria: { masteryThreshold: 0, quizScore: 0, problemsSolved: 0 },
      isCompleted: false,
    })),
    progress: 0,
    isPublic: false, // Cloned roadmaps are private by default
  });

  const savedRoadmap = await clonedRoadmap.save();
  res.status(201).json({ roadmapId: savedRoadmap._id });
});

// @desc    Update a roadmap
// @route   PUT /api/roadmaps/:id
// @access  Private
const updateRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findById(req.params.id);

  if (!roadmap) {
    res.status(404);
    throw new Error('Roadmap not found');
  }

  // Check if user is owner
  if (roadmap.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this roadmap');
  }

  // Update fields
  const { 
    title, topic, description, difficulty, totalDuration, 
    modules, learningGoals, targetRoles, expectedOutcomes, 
    skillsCovered, tags, prerequisites, isPublic 
  } = req.body;

  roadmap.title = title || roadmap.title;
  roadmap.topic = topic || roadmap.topic;
  roadmap.description = description || roadmap.description;
  roadmap.difficulty = difficulty || roadmap.difficulty;
  roadmap.totalDuration = totalDuration || roadmap.totalDuration;
  roadmap.modules = modules || roadmap.modules;
  roadmap.learningGoals = learningGoals || roadmap.learningGoals;
  roadmap.targetRoles = targetRoles || roadmap.targetRoles;
  roadmap.expectedOutcomes = expectedOutcomes || roadmap.expectedOutcomes;
  roadmap.skillsCovered = skillsCovered || roadmap.skillsCovered;
  roadmap.tags = tags || roadmap.tags;
  roadmap.prerequisites = prerequisites || roadmap.prerequisites;
  
  if (isPublic !== undefined) roadmap.isPublic = isPublic;

  const updatedRoadmap = await roadmap.save();
  res.json(updatedRoadmap);
});

// @desc    Delete a roadmap
// @route   DELETE /api/roadmaps/:id
// @access  Private
const deleteRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findById(req.params.id);

  if (!roadmap) {
    res.status(404);
    throw new Error('Roadmap not found');
  }

  // Check if user is owner
  if (roadmap.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this roadmap');
  }

  await roadmap.deleteOne();
  res.json({ message: 'Roadmap deleted successfully' });
});

export { 
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
  deleteRoadmap
};
