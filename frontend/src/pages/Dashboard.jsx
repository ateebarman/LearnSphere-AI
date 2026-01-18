import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { generateRoadmap, getUserRoadmaps } from '../services/roadmapService';
import { FaPlus, FaSpinner } from 'react-icons/fa';

const Dashboard = () => {
  const { userInfo } = useAuthStore();
  const [topic, setTopic] = useState('');
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoadmaps = async () => {
      setLoading(true);
      try {
        const data = await getUserRoadmaps();
        setRoadmaps(data);
      } catch (err) {
        setError('Failed to fetch roadmaps');
      }
      setLoading(false);
    };
    fetchRoadmaps();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic) return;
    setGenerating(true);
    setError('');
    try {
      const newRoadmap = await generateRoadmap(topic);
      navigate(`/roadmap/${newRoadmap._id}`);
    } catch (err) {
      setError('Failed to generate roadmap. Please try again.');
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-5xl font-bold">
          Welcome back, <span className="text-indigo-600">{userInfo?.name}!</span>
        </h1>
        <p className="text-xl text-gray-600">
          What would you like to learn today?
        </p>
      </div>

      {/* Generate New Roadmap */}
      <div className="card bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          ✨ Create a New Learning Roadmap
        </h2>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            className="form-input flex-grow"
            placeholder="e.g., 'React Hooks', 'Machine Learning', 'Web Design'"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary flex items-center justify-center whitespace-nowrap"
            disabled={generating}
          >
            {generating ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FaPlus className="mr-2" />
                Generate
              </>
            )}
          </button>
        </form>
      </div>

      {/* Existing Roadmaps */}
      <div>
        <h2 className="text-3xl font-bold mb-8 text-gray-900">📚 Your Roadmaps</h2>
        {loading ? (
          <div className="card text-center py-12">
            <FaSpinner className="animate-spin text-indigo-600 text-4xl mx-auto" />
            <p className="text-gray-600 mt-4">Loading your roadmaps...</p>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="card text-center py-12 bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-300">
            <p className="text-2xl text-gray-500 mb-2">🚀 No roadmaps yet</p>
            <p className="text-gray-400">Create your first learning roadmap above to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((roadmap) => (
              <Link
                to={`/roadmap/${roadmap._id}`}
                key={roadmap._id}
                className="card-hover border-l-4 border-indigo-600"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900 flex-1">
                    {roadmap.title}
                  </h3>
                  <span className="text-2xl">🎓</span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">{roadmap.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-600">Progress</span>
                    <span className="text-sm font-bold text-indigo-600">{Math.round(roadmap.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${roadmap.progress}%` }}
                    ></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;