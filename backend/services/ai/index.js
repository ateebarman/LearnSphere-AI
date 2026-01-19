// Unified AI Service Entry Point
// Routes requests to the configured provider (Gemini or Groq)

import { generateJsonGemini, initializeGemini } from './providers/gemini.client.js';
import { generateJsonGroq } from './providers/groq.client.js';

export const initializeAI = () => {
  const PROVIDER = process.env.AI_PROVIDER || 'gemini';
  console.log(`AI Provider: ${PROVIDER}`);
  if (PROVIDER === 'gemini') {
    initializeGemini();
  }
};

export const generateJson = async (prompt) => {
  const PROVIDER = process.env.AI_PROVIDER || 'gemini';
  switch (PROVIDER) {
    case 'groq':
      return generateJsonGroq(prompt);
    case 'gemini':
    default:
      return generateJsonGemini(prompt);
  }
};
