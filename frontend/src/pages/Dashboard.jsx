import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { generateRoadmap, getUserRoadmaps } from '../services/roadmapService';
import { FaPlus, FaSpinner, FaGraduationCap, FaMagic, FaBookOpen } from 'react-icons/fa';

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
    <div className="space-y-12">
      {/* Welcome Section */}
      <div className="space-y-3 relative py-4">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Welcome back, <span className="text-gradient leading-[1.2]">{userInfo?.name.split(' ')[0]}!</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
          Ready to hack your next skill today?
        </p>
      </div>

      {/* Generate New Roadmap */}
      <div className="card-premium border-none relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 text-indigo-500/10 group-hover:scale-110 transition-transform duration-500">
          <FaMagic className="text-8xl" />
        </div>

        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center space-x-3">
          <FaMagic className="text-indigo-600" />
          <span>Generate New Roadmap</span>
        </h2>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 relative z-10">
          <input
            type="text"
            className="form-input flex-grow text-lg"
            placeholder="What do you want to master? (e.g. Advanced React, LLMs, Cooking, Stoicism)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary px-8 flex items-center justify-center whitespace-nowrap text-lg"
            disabled={generating}
          >
            {generating ? (
              <>
                <FaSpinner className="animate-spin mr-3 text-xl" />
                Dreaming it up...
              </>
            ) : (
              <>
                <FaPlus className="mr-3" />
                Generate
              </>
            )}
          </button>
        </form>
      </div>

      {/* Existing Roadmaps */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b dark:border-gray-800 pb-4">
          <h2 className="text-3xl font-bold flex items-center space-x-3">
            <FaBookOpen className="text-indigo-600" />
            <span>Your Learning Path</span>
          </h2>
          <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-4 py-1 rounded-full text-sm font-bold">
            {roadmaps.length} Roadmaps
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse h-48 bg-gray-100 dark:bg-gray-800 border-none"></div>
            ))}
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaGraduationCap className="text-3xl text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-500 dark:text-gray-400 mb-2">Adventure awaits!</p>
            <p className="text-gray-400 dark:text-gray-500">Generate your first AI roadmap to see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roadmaps.map((roadmap) => (
              <Link
                to={`/roadmap/${roadmap._id}`}
                key={roadmap._id}
                className="card-hover group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FaGraduationCap className="text-6xl" />
                </div>

                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {roadmap.title}
                  </h3>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-2 text-sm">
                  {roadmap.description}
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <span>Mastery Level</span>
                    <span>{Math.round(roadmap.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
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