import dotenv from 'dotenv';
import { generateRoadmapFromAI } from './services/geminiService.js';
import { searchYouTube } from './services/youtubeService.js';

dotenv.config();

async function testAPIs() {
  console.log('🧪 Testing Gemini and YouTube APIs\n');
  console.log('================================\n');

  // Test Gemini API
  console.log('1️⃣  Testing Gemini API...');
  console.log('   Generating roadmap for: "JavaScript Basics"\n');
  
  try {
    const roadmap = await generateRoadmapFromAI('JavaScript Basics');
    console.log('✅ Gemini API Working!');
    console.log('   Generated Roadmap:');
    console.log('   Title:', roadmap.title);
    console.log('   Modules:', roadmap.modules.length);
    console.log('   Sample Module:', roadmap.modules[0]?.title);
    console.log();
  } catch (err) {
    console.log('❌ Gemini API Error:');
    console.log('   ', err.message);
    console.log();
  }

  // Test YouTube API
  console.log('2️⃣  Testing YouTube API...');
  console.log('   Searching for: "React Tutorial"\n');
  
  try {
    const videos = await searchYouTube('React Tutorial');
    console.log('✅ YouTube API Working!');
    console.log('   Found Videos:', videos.length);
    if (videos.length > 0) {
      console.log('   Sample Video:');
      console.log('   Title:', videos[0].title);
      console.log('   URL:', videos[0].url);
    }
    console.log();
  } catch (err) {
    console.log('❌ YouTube API Error:');
    console.log('   ', err.message);
    console.log();
  }

  console.log('================================');
  console.log('Test Complete!');
}

testAPIs();
