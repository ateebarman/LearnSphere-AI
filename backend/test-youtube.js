import { searchYouTube } from './services/youtubeService.js';
import dotenv from 'dotenv';

dotenv.config();

const test = async () => {
  try {
    console.log('🧪 Testing YouTube Service...');
    console.log('YOUTUBE_API_KEY exists:', !!process.env.YOUTUBE_API_KEY);
    
    const videos = await searchYouTube('React Hooks tutorial');
    console.log('✅ SUCCESS: YouTube returned:');
    console.log(JSON.stringify(videos, null, 2));
  } catch (error) {
    console.error('❌ ERROR: YouTube failed:', error.message);
    console.error('Full error:', error);
  }
};

test();
