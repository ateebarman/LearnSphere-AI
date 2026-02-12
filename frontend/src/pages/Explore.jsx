import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicRoadmaps, cloneRoadmap } from '../services/roadmapService';
import { useAuthStore } from '../store/useAuthStore';
import { FaSpinner, FaEye, FaClone, FaSearch, FaGlobe } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';

const Explore = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuthStore();
  const [roadmaps, setRoadmaps] = useState([]);
  const [filteredRoadmaps, setFilteredRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState({});
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPublicRoadmaps = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getPublicRoadmaps();
        setRoadmaps(data.roadmaps);
        setFilteredRoadmaps(data.roadmaps);
      } catch (err) {
        setError('Failed to fetch public roadmaps');
        console.error(err);
      }
      setLoading(false);
    };

    fetchPublicRoadmaps();
  }, []);

  useEffect(() => {
    const filtered = roadmaps.filter(
      (roadmap) =>
        roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roadmap.topic.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRoadmaps(filtered);
  }, [searchTerm, roadmaps]);

  const handleView = (id) => {
    navigate(`/roadmap/${id}`);
  };

  const handleClone = async (id) => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    setCloning((prev) => ({ ...prev, [id]: true }));
    try {
      const result = await cloneRoadmap(id);
      navigate(`/roadmap/${result.roadmapId}`);
    } catch (err) {
      console.error('Failed to clone roadmap:', err);
      alert('Failed to clone roadmap');
    } finally {
      setCloning((prev) => ({ ...prev, [id]: false }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="text-6xl" />
        <p className="text-gray-500 animate-pulse font-medium">Scanning the universe for knowledge...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-12 pb-20">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4 text-center md:text-left">
          <h1 className="text-5xl font-extrabold text-gradient flex items-center justify-center md:justify-start gap-4">
            <FaGlobe className="text-indigo-600 hidden md:block" />
            Explore Roadmaps
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-medium max-w-2xl">
            Discover community-curated learning paths and start your next mastery journey in seconds.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-2xl mx-auto md:mx-0">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
            <FaSearch className="text-xl" />
          </div>
          <input
            type="text"
            placeholder="Search by title, topic, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-14 py-5 text-lg shadow-lg dark:bg-gray-900"
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="card-premium border-red-500/20 bg-red-50 dark:bg-red-950/10 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center text-red-600">
              !
            </div>
            <p className="text-red-700 dark:text-red-400 font-bold">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRoadmaps.length === 0 && !error && (
          <div className="card-premium py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaSearch className="text-3xl text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {searchTerm ? "We couldn't find that topic..." : "The community library is quiet..."}
            </p>
            <p className="text-gray-400 mt-2">Try a different keyword or create your own roadmap!</p>
          </div>
        )}

        {/* Roadmaps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRoadmaps.map((roadmap) => (
            <div
              key={roadmap._id}
              className="card-hover flex flex-col h-full border-none relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

              <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest mb-3">
                  {roadmap.topic}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {roadmap.title}
                </h2>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3">
                {roadmap.description || "Master this topic with our community-vetted structure."}
              </p>

              <div className="mt-auto pt-6 border-t dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900 dark:to-blue-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold uppercase text-sm">
                    {roadmap.user?.name ? roadmap.user.name.charAt(0) : "A"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{roadmap.user?.name || "Anonymous"}</span>
                    <span className="text-xs text-gray-500">{formatDate(roadmap.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleView(roadmap._id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-bold group-hover:shadow-lg"
                >
                  <FaEye />
                  View
                </button>
                <button
                  onClick={() => handleClone(roadmap._id)}
                  disabled={cloning[roadmap._id] || !userInfo}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-bold hover:shadow-lg hover:shadow-indigo-500/30"
                >
                  {cloning[roadmap._id] ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaClone />
                  )}
                  {cloning[roadmap._id] ? 'Cloning...' : 'Clone'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Results Count */}
        {filteredRoadmaps.length > 0 && (
          <div className="text-center pt-8 border-t dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Discovered <span className="text-indigo-600 dark:text-indigo-400 font-bold">{filteredRoadmaps.length}</span> proven learning paths
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
