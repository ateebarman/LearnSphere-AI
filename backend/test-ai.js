// Quick test to verify the AI service works with new model
import { generateJson, initializeAI } from './services/ai/index.js';
import dotenv from 'dotenv';

dotenv.config();
initializeAI(); // Initialize before using

async function testAI() {
  try {
    console.log('🧪 Testing Gemini 2.5 Flash model...\n');
    
    // Test 1: Simple JSON
    console.log('Test 1: Simple JSON');
    const result1 = await generateJson('Generate a simple JSON with one key "test" and value "working"');
    console.log('✅ Success:', JSON.stringify(result1));
    
    // Test 2: Roadmap JSON
    console.log('\nTest 2: Roadmap generation');
    const roadmapPrompt = `Generate a learning roadmap for "DevOps" with exactly this JSON structure:
    {
      "title": "Learning DevOps",
      "description": "A path to DevOps mastery",
      "modules": [
        {"title": "CI/CD Basics", "description": "Learn continuous integration", "estimatedTime": "2 hours", "resources": []}
      ]
    }`;
    const result2 = await generateJson(roadmapPrompt);
    console.log('✅ Success:', JSON.stringify(result2, null, 2));
    
  } catch (error) {
    console.log('🔄 API failed, demo mode would trigger');
    console.log('Error:', error.message);
  }
}

testAI();
