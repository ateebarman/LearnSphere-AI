import { useState } from 'react';
import { getResources } from '../services/resourceService';
import { FaSpinner, FaExternalLinkAlt, FaYoutube } from 'react-icons/fa';

const ResourceLibrary = () => {
  const [topicInput, setTopicInput] = useState('');
  const [activeTopic, setActiveTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videos, setVideos] = useState([]);
  const [articles, setArticles] = useState([]);

  const suggestedTopics = ['Web Dev', 'React JS', 'Node.js', 'MongoDB', 'DSA', 'AI/ML'];

  const handleSearch = async (topic) => {
    const trimmedTopic = topic.trim();
    
    if (!trimmedTopic) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError('');
    setActiveTopic(trimmedTopic);

    try {
      const response = await getResources(trimmedTopic);
      
      // Safe mapping strategy for different response shapes
      let videosData = [];
      let articlesData = [];

      if (response.videos && response.articles) {
        // Response has direct videos and articles arrays
        videosData = Array.isArray(response.videos) ? response.videos : [];
        articlesData = Array.isArray(response.articles) ? response.articles : [];
      } else if (response.resources && Array.isArray(response.resources)) {
        // Response has resources array with type field
        videosData = response.resources.filter(r => r.type === 'video');
        articlesData = response.resources.filter(r => r.type === 'article');
      } else if (Array.isArray(response)) {
        // Response is directly an array
        videosData = response.filter(r => r.type === 'video');
        articlesData = response.filter(r => r.type === 'article');
      }

      setVideos(videosData);
      setArticles(articlesData);

      if (videosData.length === 0 && articlesData.length === 0) {
        setError(`No results found for "${trimmedTopic}"`);
      }
    } catch (err) {
      setError(`Failed to fetch resources: ${err.message || 'Unknown error'}`);
      setVideos([]);
      setArticles([]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch(topicInput);
    }
  };

  const handleChipClick = (topic) => {
    setTopicInput(topic);
    handleSearch(topic);
  };

  const handleRetry = () => {
    if (activeTopic) {
      handleSearch(activeTopic);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent mb-2">
            Resources
          </h1>
          <p className="text-gray-600">Search and discover learning resources by topic</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search a topic (e.g., React Hooks, Node Auth, DSA)"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
            <button
              onClick={() => handleSearch(topicInput)}
              disabled={loading || !topicInput.trim()}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? <FaSpinner className="animate-spin" /> : 'Search'}
            </button>
          </div>
        </div>

        {/* Suggested Topics */}
        {!activeTopic && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Suggested Topics</h2>
            <div className="flex flex-wrap gap-3">
              {suggestedTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleChipClick(topic)}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-medium hover:bg-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - Before Search */}
        {!activeTopic && !error && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-lg text-gray-600">Search for a topic to get started.</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <p className="text-red-700 font-medium mb-3">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="text-4xl text-indigo-600 animate-spin" />
          </div>
        )}

        {/* Results Section */}
        {activeTopic && !loading && !error && (
          <div className="space-y-8">
            {/* Videos Section */}
            {videos.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <FaYoutube className="mr-3 text-red-600" />
                  Videos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                    >
                      {video.thumbnail && (
                        <div className="w-full h-40 bg-gray-200 overflow-hidden">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                        {video.channel && (
                          <p className="text-sm text-gray-600 mb-4">{video.channel}</p>
                        )}
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                        >
                          Open <FaExternalLinkAlt className="ml-2" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Articles Section */}
            {articles.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {articles.map((article, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                    >
                      <h3 className="font-semibold text-gray-800 mb-2">{article.title}</h3>
                      {article.snippet && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {article.snippet}
                        </p>
                      )}
                      {article.summary && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {article.summary}
                        </p>
                      )}
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                      >
                        Read <FaExternalLinkAlt className="ml-2" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceLibrary;
