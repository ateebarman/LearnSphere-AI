import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicRoadmaps, cloneRoadmap } from '../services/roadmapService';
import { useAuthStore } from '../store/useAuthStore';
import {
  Search,
  Globe,
  Eye,
  Copy,
  Loader2,
  Sparkles,
  Calendar,
  User as UserIcon,
  ArrowUpRight,
  Filter,
  Layers,
  Map,
  Compass
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

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
        setRoadmaps(data.roadmaps || []);
        setFilteredRoadmaps(data.roadmaps || []);
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
      toast.error('Please login to clone roadmaps');
      navigate('/login');
      return;
    }

    setCloning((prev) => ({ ...prev, [id]: true }));
    const toastId = toast.loading('Synchronizing path...');
    try {
      const result = await cloneRoadmap(id);
      toast.success('Path synchronized to your library!', { id: toastId });
      navigate(`/roadmap/${result.roadmapId}`);
    } catch (err) {
      console.error('Failed to clone roadmap:', err);
      toast.error('Quantum sync failed', { id: toastId });
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-primary-500/30 blur-[80px] rounded-full animate-pulse" />
          <Loader2 className="w-16 h-16 text-primary-500 animate-spin relative z-10" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-2"
        >
          <p className="text-white font-black uppercase tracking-[0.4em] text-xs">Accessing Knowledge Base</p>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 bg-primary-400 rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden pb-32">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-600/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
        <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[130px] rounded-full opacity-40" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-[0.03] invert" />
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10 pt-16 space-y-20">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-6 max-w-4xl text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400"
            >
              <Compass className="w-4 h-4" />
              <span className="text-[10px] font-black tracking-widest uppercase">Global Discovery</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-8xl font-black tracking-tighter text-white font-display leading-[0.95] md:leading-[0.85] uppercase"
            >
              Proven <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-indigo-400 to-purple-400 px-1">
                Knowledge Paths
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-2xl"
            >
              Choose your next mastery. Explore community-curated roadmaps optimized for depth and efficiency.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 bg-slate-900/40 p-2 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl"
          >
            <button className="px-8 py-4 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-500 transition-all active:scale-95 shadow-xl shadow-primary-500/20">
              <Sparkles className="w-4 h-4" />
              Curated
            </button>
            <button className="px-8 py-4 text-slate-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Top Rated
            </button>
          </motion.div>
        </div>

        {/* Search Engine UI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative max-w-4xl px-4 md:px-0"
        >
          <div className="absolute left-8 md:left-8 top-1/2 -translate-y-1/2 text-slate-600 transition-colors pointer-events-none">
            <Search className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <input
            type="text"
            placeholder="What would you like to master today?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/5 rounded-2xl md:rounded-[2.5rem] py-5 md:py-8 pl-16 md:pl-20 pr-10 text-base md:text-xl focus:outline-none focus:border-primary-500/40 transition-all placeholder:text-slate-700 focus:ring-[8px] md:focus:ring-[12px] focus:ring-primary-500/5 backdrop-blur-md shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] text-white font-medium"
          />
          <AnimatePresence>
            {searchTerm && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => setSearchTerm('')}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-tighter"
              >
                Clear
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Metadata */}
        <div className="flex items-center gap-4">
          <div className="h-px w-12 bg-primary-500/50" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Scanning <span className="text-white">{roadmaps.length}</span> proven nodes
          </span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        {/* Roadmap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence mode="popLayout">
            {filteredRoadmaps.length > 0 ? (
              filteredRoadmaps.map((roadmap, i) => (
                <motion.div
                  key={roadmap._id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative flex flex-col h-full bg-slate-900/40 border border-white/5 rounded-3xl md:rounded-[3rem] p-6 md:p-10 hover:bg-slate-900/60 hover:border-primary-500/30 transition-all duration-700 backdrop-blur-md overflow-hidden"
                >
                  {/* Visual Accents */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 blur-[70px] rounded-full -mr-24 -mt-24 group-hover:bg-primary-500/10 transition-all duration-700" />

                  <div className="relative z-10 flex flex-col h-full space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest">
                        {roadmap.topic}
                      </div>
                      <Layers className="w-5 h-5 text-slate-700 group-hover:text-primary-400 transition-colors" />
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-3xl font-black text-white font-display leading-[0.9] group-hover:text-primary-400 transition-colors uppercase tracking-tighter">
                        {roadmap.title}
                      </h2>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-3">
                        {roadmap.description || "Master this domain with a structure optimized for cognitive retention and practical application."}
                      </p>
                    </div>

                    <div className="mt-auto space-y-8 pt-8 border-t border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1rem] bg-slate-950 border border-white/5 flex items-center justify-center text-primary-400 font-black shadow-inner">
                          {roadmap.user?.name ? roadmap.user.name.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">Verified Author</p>
                          <p className="text-sm font-bold text-white">{roadmap.user?.name || "Neural Assistant"}</p>
                        </div>
                        <div className="ml-auto flex flex-col items-end">
                          <Calendar className="w-4 h-4 text-slate-700 mb-1" />
                          <span className="text-[10px] font-bold text-slate-600">{formatDate(roadmap.createdAt)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => handleView(roadmap._id)}
                          className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest border border-white/5 group/view"
                        >
                          <Eye className="w-4 h-4 text-slate-500 group-hover/view:text-white group-hover/view:scale-110 transition-all" />
                          View Path
                        </button>
                        <button
                          onClick={() => handleClone(roadmap._id)}
                          disabled={cloning[roadmap._id] || !userInfo}
                          className="flex items-center justify-center gap-2 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary-900/20 active:scale-95 disabled:opacity-50 group/clone"
                        >
                          {cloning[roadmap._id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Copy className="w-4 h-4 group-hover/clone:scale-110 transition-all" />
                          )}
                          {cloning[roadmap._id] ? 'Syncing' : 'Clone Node'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-40 flex flex-col items-center justify-center text-center space-y-8"
              >
                <div className="w-32 h-32 bg-slate-900/50 border border-white/5 rounded-full flex items-center justify-center shadow-[0_0_100px_-20px_rgba(59,130,246,0.1)]">
                  <Map className="w-12 h-12 text-slate-700" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-white tracking-tighter uppercase">No Signal Found</h3>
                  <p className="text-slate-500 max-w-sm font-medium">
                    {searchTerm
                      ? `The knowledge node for "${searchTerm}" is not currently in the repository.`
                      : "The global discovery library is currently offline or empty."}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Discovery Footer */}
        {filteredRoadmaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-6 pt-20 border-t border-white/5"
          >
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-1">Global Coverage</p>
                <p className="text-2xl font-black text-white">99.4%</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-1">Node Integrity</p>
                <p className="text-2xl font-black text-white text-emerald-400 font-display">OPTIMAL</p>
              </div>
            </div>
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]">
              Showing <span className="text-primary-400">{filteredRoadmaps.length}</span> Knowledge Fragments
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Explore;
