import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRoadmapById, toggleRoadmapVisibility } from '../services/roadmapService';
import { useAuthStore } from '../store/useAuthStore';
import ModuleCard from '../components/ModuleCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { FaLock, FaGlobe, FaSpinner, FaArrowLeft, FaCheckCircle, FaShareAlt, FaMapSigns } from 'react-icons/fa';

const RoadmapView = () => {
  const { id } = useParams();
  const { userInfo } = useAuthStore();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openModule, setOpenModule] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  useEffect(() => {
    const fetchRoadmap = async () => {
      setLoading(true);
      try {
        const data = await getRoadmapById(id);
        setRoadmap(data);
        // Automatically open the first non-completed module
        const firstIncomplete = data.modules.findIndex(m => !m.isCompleted);
        setOpenModule(firstIncomplete !== -1 ? firstIncomplete : 0);
      } catch (err) {
        setError('Failed to fetch roadmap details');
      }
      setLoading(false);
    };
    fetchRoadmap();
  }, [id]);

  const isOwner = userInfo && roadmap && (roadmap.user === userInfo._id || roadmap.user?._id === userInfo._id);

  const handleToggleVisibility = async () => {
    setToggleLoading(true);
    try {
      const result = await toggleRoadmapVisibility(id);
      setRoadmap((prev) => ({
        ...prev,
        isPublic: result.isPublic,
      }));
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="text-7xl" />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="card-premium max-w-lg mx-auto py-20 text-center space-y-6 mt-12">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-3xl flex items-center justify-center text-4xl mx-auto">!</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black dark:text-white">{error || 'Roadmap Not Found'}</h2>
          <p className="text-gray-500 font-medium">This path might be private or doesn't exist.</p>
        </div>
        <Link to="/explore" className="btn-primary inline-block px-10">Back to Discovery</Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto">
      {/* Navigation & Actions */}
      <div className="flex flex-wrap justify-between items-center gap-6">
        <Link to="/explore" className="group flex items-center gap-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-black text-sm uppercase tracking-widest transition-all">
          <FaArrowLeft className="transition-transform group-hover:-translate-x-1" />
          Back to Explorations
        </Link>

        <div className="flex items-center gap-4">
          {isOwner && (
            <button
              onClick={handleToggleVisibility}
              disabled={toggleLoading}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 ${roadmap.isPublic
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200'
                : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                }`}
            >
              {toggleLoading ? (
                <FaSpinner className="animate-spin" />
              ) : roadmap.isPublic ? (
                <> <FaGlobe /> PUBLIC ACCESS </>
              ) : (
                <> <FaLock /> PRIVATE SESSION </>
              )}
            </button>
          )}
          <button className="p-3 bg-gray-50 dark:bg-gray-900 text-gray-500 hover:text-indigo-600 rounded-2xl transition-all border dark:border-gray-800">
            <FaShareAlt />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-black text-gradient leading-tight flex items-center gap-4">
            <FaMapSigns className="text-indigo-600 shrink-0" />
            {roadmap.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-4xl">
            {roadmap.description}
          </p>
        </div>

        {/* Dynamic Progress Dashboard */}
        <div className="card-premium p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-indigo-100 dark:border-indigo-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-10 -mt-10"></div>

          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Survival Progress</span>
              <span className="text-2xl font-black dark:text-white">{Math.round(roadmap.progress || 0)}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4 relative overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-lg shadow-indigo-600/40"
                style={{ width: `${roadmap.progress || 0}%` }}
              />
            </div>
          </div>

          <div className="flex justify-around md:justify-center gap-12 font-black border-l dark:border-gray-800 h-full py-2">
            <div className="text-center">
              <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-1">Modules</p>
              <p className="text-2xl dark:text-white">{roadmap.modules?.length || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-1">Status</p>
              <p className="text-sm dark:text-white flex items-center gap-2">
                {roadmap.progress === 100 ? (
                  <span className="text-green-500">MASTERED <FaCheckCircle className="inline" /></span>
                ) : (
                  <span className="text-indigo-600 font-black animate-pulse uppercase tracking-widest">In Progress</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Notice for Guest Views */}
      {!isOwner && (
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl text-white shadow-xl shadow-indigo-600/20 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom duration-700">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-lg font-black tracking-tight">Viewing Public Exploration</p>
            <p className="text-sm font-medium opacity-80">This session is being shared. Sign in to clone and track your own mastery.</p>
          </div>
          <Link to="/signup" className="px-8 py-3 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all active:scale-95 whitespace-nowrap">
            Clones This Roadmap
          </Link>
        </div>
      )}

      {/* Modules List */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black dark:text-white px-2 mb-2">Knowledge Nodes</h3>
        <div className="space-y-6">
          {roadmap.modules.map((module, index) => (
            <ModuleCard
              key={index}
              module={module}
              roadmapId={roadmap._id}
              index={index}
              defaultOpen={index === openModule}
              isOwner={isOwner}
            />
          ))}
        </div>
      </div>

      {/* Final Encouragement */}
      {roadmap.progress === 100 && (
        <div className="card-premium py-16 text-center space-y-6 border-dashed border-2 border-indigo-200 dark:border-indigo-900 mt-20">
          <div className="w-24 h-24 bg-green-50 dark:bg-green-950/20 text-green-500 rounded-full flex items-center justify-center text-5xl mx-auto shadow-xl">
            🏆
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black dark:text-white">Path Fully Manifested!</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-md mx-auto">You've successfully integrated all knowledge nodes in this roadmap. Time for a new challenge?</p>
          </div>
          <Link to="/explore" className="btn-primary inline-block px-12">Start New Exploration</Link>
        </div>
      )}
    </div>
  );
};

export default RoadmapView;