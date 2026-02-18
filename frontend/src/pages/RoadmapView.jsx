import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRoadmapById, toggleRoadmapVisibility } from '../services/roadmapService';
import { useAuthStore } from '../store/useAuthStore';
import ModuleCard from '../components/ModuleCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import {
  Lock,
  Globe,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Share2,
  Map as MapIcon,
  Shield,
  Zap,
  Target,
  Layers,
  Sparkles,
  Trophy,
  Crosshair,
  BookOpen,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

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
    const toastId = toast.loading('Modifying access protocols...');
    try {
      const result = await toggleRoadmapVisibility(id);
      setRoadmap((prev) => ({
        ...prev,
        isPublic: result.isPublic,
      }));
      toast.success(result.isPublic ? 'Path is now Global' : 'Path is now Encrypted', { id: toastId });
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
      toast.error('Protocol breach failed', { id: toastId });
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
        <LoadingSpinner size="text-7xl" />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs animate-pulse">Initializing Interface...</p>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 border border-white/5 p-12 rounded-[3rem] max-w-lg w-full text-center space-y-8 backdrop-blur-xl shadow-2xl"
        >
          <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-[2rem] flex items-center justify-center text-4xl mx-auto border border-rose-500/20">
            <Shield className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{error || 'Access Denied'}</h2>
            <p className="text-slate-400 font-medium">This knowledge node is either encrypted or has been demanifested from our servers.</p>
          </div>
          <Link to="/explore" className="inline-flex items-center gap-2 px-10 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-500 transition-all active:scale-95 shadow-xl shadow-primary-900/20">
            <ArrowLeft className="w-4 h-4" />
            Back to Base
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden pb-32">
      {/* Background Accents */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02] invert" />
      </div>

      <div className="max-w-6xl mx-auto px-8 relative z-10 pt-12 space-y-12">
        {/* Navigation & Actions */}
        <div className="flex flex-wrap justify-between items-center gap-6">
          <Link to="/explore" className="group flex items-center gap-3 text-slate-500 hover:text-primary-400 font-black text-[10px] uppercase tracking-[0.2em] transition-all">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover:border-primary-500/30">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
            Back to Discovery
          </Link>

          <div className="flex items-center gap-3">
            {isOwner && (
              <button
                onClick={handleToggleVisibility}
                disabled={toggleLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 border ${roadmap.isPublic
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'bg-primary-500/10 text-primary-400 border-primary-500/20 hover:bg-primary-500/20'
                  }`}
              >
                {toggleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : roadmap.isPublic ? (
                  <> <Globe className="w-4 h-4" /> Global Access Enabled </>
                ) : (
                  <> <Lock className="w-4 h-4" /> Private Session Mode </>
                )}
              </button>
            )}
            <button className="p-3 bg-slate-900/50 text-slate-500 hover:text-white rounded-2xl transition-all border border-white/5 hover:border-white/10 backdrop-blur-md shadow-xl group">
              <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-500 font-black text-[9px] uppercase tracking-widest">
              <Layers className="w-3 h-3" />
              Knowledge Fragment {roadmap.topic}
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter leading-[0.85] font-display uppercase">
              {roadmap.title}
            </h1>
            <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-4xl">
              {roadmap.description}
            </p>

            {/* Roadmap Intelligence Metadata */}
            {(roadmap.learningGoals?.length > 0 || roadmap.targetRoles?.length > 0 || roadmap.skillsCovered?.length > 0 || roadmap.prerequisites?.length > 0 || roadmap.tags?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
                {roadmap.learningGoals?.length > 0 && (
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-2">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5"><Crosshair className="w-3 h-3" /> Learning Goals</span>
                    <ul className="space-y-1">
                      {roadmap.learningGoals.map((g, i) => <li key={i} className="text-xs text-slate-400 flex items-start gap-2"><span className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 shrink-0" />{g}</li>)}
                    </ul>
                  </div>
                )}
                {roadmap.targetRoles?.length > 0 && (
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-2">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5"><Target className="w-3 h-3" /> Target Roles</span>
                    <div className="flex flex-wrap gap-1.5">
                      {roadmap.targetRoles.map((r, i) => <span key={i} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold">{r}</span>)}
                    </div>
                  </div>
                )}
                {roadmap.expectedOutcomes?.length > 0 && (
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-2">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5"><Award className="w-3 h-3" /> Expected Outcomes</span>
                    <ul className="space-y-1">
                      {roadmap.expectedOutcomes.map((o, i) => <li key={i} className="text-xs text-slate-400 flex items-start gap-2"><span className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 shrink-0" />{o}</li>)}
                    </ul>
                  </div>
                )}
                {roadmap.skillsCovered?.length > 0 && (
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-2">
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> Skills Covered</span>
                    <div className="flex flex-wrap gap-1.5">
                      {roadmap.skillsCovered.map((s, i) => <span key={i} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px] font-bold">{s}</span>)}
                    </div>
                  </div>
                )}
                {roadmap.prerequisites?.length > 0 && (
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-2">
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5"><Zap className="w-3 h-3" /> Prerequisites</span>
                    <ul className="space-y-1">
                      {roadmap.prerequisites.map((p, i) => <li key={i} className="text-xs text-slate-400 flex items-start gap-2"><span className="w-1 h-1 bg-rose-500 rounded-full mt-1.5 shrink-0" />{p}</li>)}
                    </ul>
                  </div>
                )}
                {roadmap.tags?.length > 0 && (
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Layers className="w-3 h-3" /> Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {roadmap.tags.map((t, i) => <span key={i} className="px-2 py-0.5 bg-white/5 text-slate-400 border border-white/10 rounded text-[10px] font-bold">{t}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Dynamic Progress Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 backdrop-blur-3xl shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-primary-600/10 transition-colors duration-1000"></div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">
              <div className="md:col-span-8 space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400 flex items-center gap-2">
                      <Zap className="w-3 h-3 fill-current" /> Mastery Level
                    </span>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Current Sync</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black text-white font-display">{Math.round(roadmap.progress || 0)}%</span>
                  </div>
                </div>

                <div className="relative h-4 bg-slate-950 rounded-full border border-white/5 overflow-hidden p-1 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${roadmap.progress || 0}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary-600 via-indigo-500 to-primary-400 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20" />
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2"
                    />
                  </motion.div>
                </div>
              </div>

              <div className="md:col-span-4 grid grid-cols-2 gap-8 border-l border-white/5 md:pl-12">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                    <Target className="w-3 h-3" /> Nodes
                  </p>
                  <p className="text-3xl font-black text-white">{roadmap.modules?.length || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Status
                  </p>
                  <div className="text-sm">
                    {roadmap.progress === 100 ? (
                      <span className="text-emerald-400 font-black tracking-tighter flex items-center gap-1.5">
                        MASTERED <CheckCircle2 className="w-4 h-4 shadow-emerald-500/50" />
                      </span>
                    ) : (
                      <span className="text-primary-400 font-black animate-pulse uppercase tracking-[0.2em] text-[10px]">Processing</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Info Notice for Guest Views */}
        {!isOwner && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="group relative p-8 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-[2.5rem] text-white shadow-2xl shadow-primary-900/30 flex flex-col sm:flex-row items-center justify-between gap-8 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 pointer-events-none" />
            <div className="relative z-10 space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">
                <Globe className="w-3 h-3" /> External Access Mode
              </div>
              <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">Clone this Fragment</h4>
              <p className="text-slate-100 font-medium opacity-80 text-sm">Save this path to your personal database to track progress and unlock full telemetry.</p>
            </div>
            <Link to="/signup" className="relative z-10 px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:scale-105 transition-all active:scale-95 shadow-xl">
              Initiate Sync
            </Link>
          </motion.div>
        )}

        {/* Modules List */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 px-2">
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Knowledge Nodes</h3>
            <div className="h-px flex-1 bg-white/5" />
            <div className="p-2 bg-slate-900 border border-white/10 rounded-lg">
              <MapIcon className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-6">
            {roadmap.modules.map((module, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (index * 0.1) }}
              >
                <ModuleCard
                  module={module}
                  roadmapId={roadmap._id}
                  index={index}
                  defaultOpen={index === openModule}
                  isOwner={isOwner}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Final Encouragement */}
        <AnimatePresence>
          {roadmap.progress === 100 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-20 text-center space-y-8 bg-slate-900/30 border border-dashed border-primary-500/30 rounded-[4rem] mt-32 overflow-hidden"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.1)_0%,_transparent_70%)]"
              />

              <div className="relative z-10 space-y-8">
                <div className="w-32 h-32 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-5xl mx-auto border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                  <Trophy className="w-16 h-16 shadow-lg" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none font-display">Path Fully Integrated!</h2>
                  <p className="text-slate-400 font-medium max-w-lg mx-auto text-lg leading-relaxed">You have successfully assimilated all knowledge nodes within this roadmap. Your cognitive profile has been updated.</p>
                </div>
                <Link to="/explore" className="inline-flex items-center gap-3 px-12 py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all active:scale-95 shadow-2xl shadow-emerald-900/20 group">
                  New Discovery <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RoadmapView;
