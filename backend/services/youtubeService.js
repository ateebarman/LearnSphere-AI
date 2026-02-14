import axios from 'axios';

/**
 * Searches YouTube for videos related to a given topic.
 */
export const searchYouTubeVideos = async (topic, maxResults = 2) => {
  // Read key inside the function to ensure it's loaded after dotenv
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  if (!YOUTUBE_API_KEY) {
    console.warn('⚠️  YOUTUBE_API_KEY not found in environment');
    return [];
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: topic, // Use the query exactly as provided by the service
        maxResults,
        key: YOUTUBE_API_KEY,
        type: 'video',
        relevanceLanguage: 'en',
        order: 'relevance' // Priority on relevance for specific subtopics
      }
    });

    return response.data.items.slice(0, maxResults).map(item => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      description: item.snippet.description,
      type: 'video',
      thumbnail: item.snippet.thumbnails?.medium?.url
    }));
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    if (errorMsg.toLowerCase().includes('quota') || error.response?.status === 403) {
      console.warn('⚠️  YouTube API Quota Exceeded. Returning empty results.');
    } else {
      console.error('❌ YouTube Search Error:', errorMsg);
    }
    return [];
  }
};

export const searchYouTube = searchYouTubeVideos;
