// Unified AI Service Entry Point
// Routes requests to the configured provider (Gemini or Groq)

import { generateJsonGemini, initializeGemini } from './providers/gemini.client.js';
import { generateJsonGroq, initializeGroq } from './providers/groq.client.js';

export const initializeAI = () => {
  const PROVIDER = process.env.AI_PROVIDER || 'gemini';
  console.log(`AI Provider: ${PROVIDER}`);
  if (PROVIDER === 'gemini' || PROVIDER === 'hybrid') {
    initializeGemini();
  }
  if (PROVIDER === 'groq' || PROVIDER === 'hybrid') {
    initializeGroq();
  }
};

export const generateJson = async (prompt) => {
  const PROVIDER = process.env.AI_PROVIDER || 'gemini';
  
  if (PROVIDER === 'hybrid') {
    try {
      // Try Groq first (it now has its own retry logic across 7 keys)
      return await generateJsonGroq(prompt);
    } catch (groqError) {
      console.warn(`⚠️ Groq Hybrid failure: ${groqError.message}. Falling back to Gemini...`);
      try {
        // Fallback to Gemini if all Groq keys fail
        return await generateJsonGemini(prompt);
      } catch (geminiError) {
        throw new Error(`Hybrid AI Failure: [Groq: ${groqError.message}] [Gemini: ${geminiError.message}]`);
      }
    }
  }

  switch (PROVIDER) {
    case 'groq':
      return generateJsonGroq(prompt);
    case 'gemini':
    default:
      return generateJsonGemini(prompt);
  }
};
