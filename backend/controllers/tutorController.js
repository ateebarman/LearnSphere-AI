import asyncHandler from 'express-async-handler';
import Roadmap from '../models/roadmapModel.js';
import KnowledgeNode from '../models/knowledgeModel.js';
import { chatWithTutor } from '../services/grokTutorService.js';

// @desc    Chat with AI tutor
// @route   POST /api/tutor
// @access  Private
const handleTutorChat = asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    res.status(400);
    throw new Error('Message is required');
  }

  // Validate history format
  if (!Array.isArray(history)) {
    res.status(400);
    throw new Error('History must be an array');
  }

  // GROUNDING: Find relevant internal knowledge
  const keywords = message.split(' ').filter(word => word.length > 3);
  const relevantDocs = await KnowledgeNode.find({
    $or: [
      { topic: { $regex: new RegExp(keywords.join('|'), 'i') } },
      { category: { $regex: new RegExp(keywords.join('|'), 'i') } }
    ]
  }).select('topic summary detailedContent').limit(2);

  const knowledgeContext = relevantDocs.map(doc => 
    `INTERNAL DOCUMENTATION [${doc.topic}]:\n${doc.summary}\n${doc.detailedContent}`
  ).join('\n\n');

  try {
    const reply = await chatWithTutor(message, history, knowledgeContext);

    res.json({
      success: true,
      reply,
    });
  } catch (error) {
    res.status(500);
    throw error;
  }
});

export { handleTutorChat };
