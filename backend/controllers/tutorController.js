import asyncHandler from 'express-async-handler';
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

  try {
    const reply = await chatWithTutor(message, history);

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
