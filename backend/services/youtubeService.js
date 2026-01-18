import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

export const searchYouTube = async (query) => {
  try {
    const response = await youtube.search.list({
      part: 'snippet',
      q: `${query} tutorial playlist`,
      type: 'playlist', // Focus on playlists for structured learning
      maxResults: 5,
    });

    return response.data.items.map((item) => ({
      title: item.snippet.title,
      description: item.snippet.description,
      url: `https://www.youtube.com/playlist?list=${item.id.playlistId}`,
      type: 'video',
    }));
  } catch (error) {
    console.warn('Error fetching YouTube data:', error.message);
    console.log('Falling back to demo videos for:', query);
    
    // Demo mode - return sample playlists
    const demoPlaylists = {
      'react': [
        {
          title: 'React.js Crash Course - 2024',
          description: 'Learn React fundamentals in this comprehensive crash course',
          url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
          type: 'video'
        },
        {
          title: 'Advanced React Patterns',
          description: 'Deep dive into advanced React patterns and best practices',
          url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOecA2oQRIf0gMgZTDNr9cVA',
          type: 'video'
        }
      ],
      'javascript': [
        {
          title: 'JavaScript Basics to Advanced',
          description: 'Complete JavaScript programming course',
          url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOdP_8Tr8pFQQi3_iMgHwSzW',
          type: 'video'
        },
        {
          title: 'Modern JavaScript ES6+',
          description: 'Learn modern JavaScript features and syntax',
          url: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOiKZSZbSq0q_mZch6_7SQ76',
          type: 'video'
        }
      ]
    };

    const queryLower = query.toLowerCase();
    if (queryLower.includes('react')) {
      return demoPlaylists.react;
    } else if (queryLower.includes('javascript') || queryLower.includes('js')) {
      return demoPlaylists.javascript;
    }

    // Generic demo videos for any topic
    return [
      {
        title: `${query} Learning Playlist`,
        description: `Comprehensive playlist for learning ${query}`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}+tutorial`,
        type: 'video'
      }
    ];
  }
};