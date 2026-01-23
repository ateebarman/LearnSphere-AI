import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicRoadmaps, cloneRoadmap } from '../services/roadmapService';
import { useAuthStore } from '../store/useAuthStore';
import { FaSpinner, FaEye, FaClone } from 'react-icons/fa';
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
    return <LoadingSpinner size="text-6xl" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent mb-2">
            Explore Roadmaps
          </h1>
          <p className="text-gray-600">
            Discover learning roadmaps created by the community and clone them to your account
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <input
            type="text"
            placeholder="Search by title or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRoadmaps.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-lg text-gray-600">
              {searchTerm ? 'No roadmaps match your search' : 'No public roadmaps available yet'}
            </p>
          </div>
        )}

        {/* Roadmaps Grid */}
        {filteredRoadmaps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoadmaps.map((roadmap) => (
              <div
                key={roadmap._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white truncate">
                    {roadmap.title}
                  </h2>
                  <p className="text-indigo-100 text-sm">{roadmap.topic}</p>
                </div>

                {/* Card Content */}
                <div className="flex-1 px-6 py-4">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {roadmap.description || 'No description available'}
                  </p>

                  {/* Creator Info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">By:</span>{' '}
                      {roadmap.user?.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created on {formatDate(roadmap.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={() => handleView(roadmap._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    <FaEye />
                    View
                  </button>
                  <button
                    onClick={() => handleClone(roadmap._id)}
                    disabled={cloning[roadmap._id] || !userInfo}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
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
        )}

        {/* Results Count */}
        {filteredRoadmaps.length > 0 && (
          <p className="text-center text-gray-600 mt-8">
            Showing {filteredRoadmaps.length} roadmap{filteredRoadmaps.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
};

export default Explore;
