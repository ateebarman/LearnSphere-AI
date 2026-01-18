import { generateRoadmapFromAI } from './services/geminiService.js';
import dotenv from 'dotenv';

dotenv.config();

const test = async () => {
  try {
    console.log('🧪 Testing Gemini Service...');
    console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
    
    const roadmap = await generateRoadmapFromAI('React Hooks');
    console.log('✅ SUCCESS: Gemini returned:');
    console.log(JSON.stringify(roadmap, null, 2));
  } catch (error) {
    console.error('❌ ERROR: Gemini failed:', error.message);
    console.error('Full error:', error);
  }
};

test();
