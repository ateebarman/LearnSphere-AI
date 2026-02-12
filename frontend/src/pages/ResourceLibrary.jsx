import { useState } from 'react';
import { getResources } from '../services/resourceService';
import { FaSpinner, FaExternalLinkAlt, FaYoutube, FaSearch, FaBookOpen, FaLightbulb, FaArrowRight } from 'react-icons/fa';

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

      let videosData = [];
      let articlesData = [];

      if (response.videos && response.articles) {
        videosData = Array.isArray(response.videos) ? response.videos : [];
        articlesData = Array.isArray(response.articles) ? response.articles : [];
      } else if (response.resources && Array.isArray(response.resources)) {
        videosData = response.resources.filter(r => r.type === 'video');
        articlesData = response.resources.filter(r => r.type === 'article');
      } else if (Array.isArray(response)) {
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

  return (
    <div className="space-y-12 pb-20">
      {/* Page Title */}
      <div className="space-y-4">
        <h1 className="text-5xl font-extrabold text-gradient flex items-center gap-4">
          <FaBookOpen className="text-indigo-600" />
          Resource Library
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">Search the globe for the finest learning materials curated for your path.</p>
      </div>

      {/* Search & Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-premium relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 space-y-4">
              <label className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Discover</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search a topic (e.g., React Hooks, Node Auth, DSA)"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-indigo-600 dark:focus:border-indigo-500 rounded-2xl focus:outline-none transition-all disabled:opacity-50 font-medium dark:text-white"
                  />
                </div>
                <button
                  onClick={() => handleSearch(topicInput)}
                  disabled={loading || !topicInput.trim()}
                  className="btn-primary px-8 py-4 flex items-center gap-2"
                >
                  {loading ? <FaSpinner className="animate-spin text-xl" /> : <><FaSearch /> <span>Search</span></>}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card-premium">
          <h2 className="text-lg font-black dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
            <FaLightbulb className="text-yellow-500" />
            Suggested
          </h2>
          <div className="flex flex-wrap gap-2">
            {suggestedTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => handleChipClick(topic)}
                disabled={loading}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all border border-indigo-100 dark:border-white/10"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {!activeTopic && !error && (
        <div className="card-premium py-20 text-center opacity-50 animate-in fade-in duration-700">
          <FaSearch className="text-6xl mx-auto mb-6 text-indigo-200 dark:text-indigo-900" />
          <p className="text-xl font-bold">The library is open. What will you learn today?</p>
        </div>
      )}

      {error && (
        <div className="card-premium border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center py-12">
          <p className="text-red-600 dark:text-red-400 font-black text-xl mb-4">{error}</p>
          <button onClick={() => handleSearch(activeTopic)} className="btn-secondary">Try Again</button>
        </div>
      )}

      {/* Results Section */}
      {activeTopic && !loading && !error && (
        <div className="space-y-16 animate-in slide-in-from-bottom duration-500">
          {/* Videos Section */}
          {videos.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black flex items-center gap-4 dark:text-white">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                    <FaYoutube />
                  </div>
                  Premium Video Content
                </h2>
                <div className="h-px flex-grow mx-8 bg-gray-100 dark:bg-gray-800 hidden md:block"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.map((video, idx) => (
                  <div key={idx} className="card-hover group p-0 overflow-hidden flex flex-col border-none shadow-xl bg-white dark:bg-gray-900">
                    {video.thumbnail && (
                      <div className="aspect-video relative overflow-hidden">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-red-600/90 text-white flex items-center justify-center text-xl animate-pulse">
                            <FaYoutube />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{video.channel || 'Educational Resource'}</p>
                        <h3 className="text-lg font-bold leading-tight line-clamp-2 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {video.title}
                        </h3>
                      </div>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between group/link font-black text-xs text-gray-500 hover:text-indigo-600 transition-all pt-4 border-t dark:border-gray-800"
                      >
                        WATCH RESOURCE <FaArrowRight className="transition-transform group-hover/link:translate-x-1" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Articles Section */}
          {articles.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black flex items-center gap-4 dark:text-white">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                    <FaBookOpen />
                  </div>
                  Deep-Dive Articles
                </h2>
                <div className="h-px flex-grow mx-8 bg-gray-100 dark:bg-gray-800 hidden md:block"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {articles.map((article, idx) => (
                  <div key={idx} className="card-hover group border-none shadow-xl bg-white dark:bg-gray-900 flex flex-col justify-between p-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-indigo-600">
                          <FaBookOpen />
                        </div>
                        <FaExternalLinkAlt className="text-gray-300" />
                      </div>
                      <h3 className="text-2xl font-black leading-tight dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{article.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 font-medium">
                        {article.snippet || article.summary || 'Expert level insight on this topic.'}
                      </p>
                    </div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary mt-8 w-full flex items-center justify-center gap-2"
                    >
                      Read Full Article <FaExternalLinkAlt size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceLibrary;
