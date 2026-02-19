import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { generateRoadmap, getUserRoadmaps } from '../services/roadmapService';
import { getAnalytics } from '../services/analyticsService';
import {
  Sparkles, Plus, Loader2, GraduationCap,
  BookOpen, Search, ArrowRight, BarChart3,
  BrainCircuit, Layout, Shield, Code2, Map,
  Users, Zap, ChevronRight, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import SkillTree from '../components/SkillTree';
import { getAdminStats } from '../services/adminService';

const Dashboard = () => {
  const { userInfo, refreshProfile } = useAuthStore();
  const [topic, setTopic] = useState('');
  const [roadmaps, setRoadmaps] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [adminStats, setAdminStats] = useState(null);
  const navigate = useNavigate();

  const isAdmin = userInfo?.role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Refresh profile first to sync role and other fields
        await refreshProfile();

        const [roadmapsData, analyticsData] = await Promise.all([
          getUserRoadmaps(),
          getAnalytics()
        ]);
        setRoadmaps(roadmapsData);
        setAnalytics(analyticsData);

        // Fetch admin stats — check store directly since isAdmin may have just updated
        const freshUser = useAuthStore.getState().userInfo;
        if (freshUser?.role === 'admin') {
          try {
            const stats = await getAdminStats();
            setAdminStats(stats);
          } catch { }
        }
      } catch (err) {
        setError('Failed to fetch dashboard data');
      }
      setLoading(false);
    };
    fetchData();
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

  const container = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  const item = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  const adminQuickActions = [
    {
      to: '/admin',
      icon: Code2,
      title: 'Problem Management',
      desc: 'Add, delete, or AI-generate coding problems',
      stat: adminStats?.totalProblems,
      statLabel: 'Problems',
      color: 'emerald',
      bg: 'from-emerald-600 to-teal-600'
    },
    {
      to: '/admin',
      icon: BookOpen,
      title: 'Knowledge Base',
      desc: 'Manage study materials and concepts',
      stat: adminStats?.totalKnowledge,
      statLabel: 'Entries',
      color: 'purple',
      bg: 'from-purple-600 to-indigo-600'
    },
    {
      to: '/admin',
      icon: Map,
      title: 'Roadmap Control',
      desc: 'Create official roadmaps and moderate community',
      stat: adminStats?.totalRoadmaps,
      statLabel: 'Public',
      color: 'rose',
      bg: 'from-rose-600 to-pink-600'
    },
  ];

  return (
    <motion.div
      className="space-y-12 pb-20"
      variants={container}
      initial="initial"
      animate="animate"
    >
      {/* Welcome Section */}
      <motion.div variants={item} className="space-y-4 md:space-y-2">
        <div className="flex items-center gap-3 mb-1">
          {isAdmin && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest">
              <Shield className="w-3 h-3" /> Administrator
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight leading-tight">
          Welcome back, <br className="sm:hidden" />
          <span className="text-gradient leading-[1.2]">{userInfo?.name.split(' ')[0]}!</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium font-display">
          {isAdmin ? 'Platform command center at your fingertips.' : 'Ready to hack your next skill today?'}
        </p>
      </motion.div>

      {/* ═══════ ADMIN COMMAND CENTER ═══════ */}
      {isAdmin && (
        <motion.div variants={item} className="space-y-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-3xl border border-rose-500/10 p-8 shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-500/10 to-orange-500/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              {/* Admin Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/30 flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white font-display">Admin Command Center</h2>
                    <p className="text-xs md:text-sm text-slate-400 font-medium">Platform management & content control</p>
                  </div>
                </div>
                <Link
                  to="/admin"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all group"
                >
                  Open Full Panel
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Stats Row */}
              <div className="flex overflow-x-auto md:grid md:grid-cols-5 gap-3 md:gap-4 mb-8 pb-4 md:pb-0 scrollbar-hide">
                {[
                  { icon: Users, label: 'Users', value: adminStats?.totalUsers, color: 'text-blue-400' },
                  { icon: Code2, label: 'Problems', value: adminStats?.totalProblems, color: 'text-emerald-400' },
                  { icon: Zap, label: 'Submissions', value: adminStats?.totalSubmissions, color: 'text-amber-400' },
                  { icon: BookOpen, label: 'Knowledge', value: adminStats?.totalKnowledge, color: 'text-purple-400' },
                  { icon: Map, label: 'Roadmaps', value: adminStats?.totalRoadmaps, color: 'text-rose-400' },
                ].map((stat, i) => (
                  <div key={i} className="min-w-[120px] md:min-w-0 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/[0.06] transition-all">
                    <stat.icon className={`w-4 h-4 ${stat.color} flex-shrink-0`} />
                    <div>
                      <p className="text-lg font-black text-white leading-none">{stat.value ?? '—'}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {adminQuickActions.map((action, i) => (
                  <Link
                    key={i}
                    to={action.to}
                    className="group relative bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.06] hover:border-white/10 transition-all overflow-hidden"
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${action.bg} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity`} />
                    <div className="relative z-10">
                      <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3`}>
                        <action.icon className={`w-4 h-4 text-${action.color}-400`} />
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">{action.title}</h4>
                      <p className="text-[11px] text-slate-500 mb-3">{action.desc}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black text-${action.color}-400 uppercase tracking-widest`}>
                          {action.stat ?? '—'} {action.statLabel}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Skill Tree Visualizer */}
      {analytics?.categoryMastery && (
        <motion.div variants={item}>
          <SkillTree masteryData={analytics.categoryMastery} />
        </motion.div>
      )}

      {/* Generate New Roadmap */}
      <motion.div variants={item} className="card-premium relative overflow-hidden group border-none">
        <div className="absolute top-0 right-0 p-8 text-primary-500/10 group-hover:scale-110 transition-transform duration-700">
          <BrainCircuit className="w-48 h-48" />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold font-display">Ignite Your Next Journey</h2>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              className="form-input flex-grow text-base md:text-lg py-3 md:py-4"
              placeholder="What do you want to master?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary px-8 text-base md:text-lg font-bold min-w-[160px]"
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5 mr-3" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Generate
                </>
              )}
            </button>
          </form>

          {error && (
            <p className="text-red-500 text-sm font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              {error}
            </p>
          )}
        </div>
      </motion.div>

      {/* Quick Links Group */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link to="/library" className="card-premium group relative overflow-hidden border-slate-200 dark:border-slate-800">
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold font-display">Knowledge Hub</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Explore curated expert resources.</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-primary-500 transition-colors group-hover:translate-x-1" />
          </div>
          <div className="absolute -bottom-6 -right-6 text-primary-500/5 text-9xl font-black rotate-12 group-hover:scale-110 transition-transform">
            DOCS
          </div>
        </Link>

        <Link to="/explore" className="card-premium group relative overflow-hidden border-slate-200 dark:border-slate-800">
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/50 rounded-2xl flex items-center justify-center text-secondary-600 dark:text-secondary-400 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold font-display">Community Pool</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Find paths from other learners.</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-secondary-500 transition-colors group-hover:translate-x-1" />
          </div>
          <div className="absolute -bottom-6 -right-6 text-secondary-500/5 text-9xl font-black rotate-12 group-hover:scale-110 transition-transform">
            PATH
          </div>
        </Link>
      </motion.div>

      {/* Main Roadmap Grid */}
      <motion.div variants={item} className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <Layout className="w-6 h-6 text-primary-500" />
            <h2 className="text-3xl font-bold font-display">Your Learning Paths</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold font-display">
              <BarChart3 className="w-4 h-4 text-primary-500" />
              <span className="text-slate-600 dark:text-slate-300">{roadmaps.length} Roadmaps</span>
            </div>
            <Link to="/planner" className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-primary-600 hover:bg-primary-500 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary-600/20">
              <Calendar className="w-4 h-4" /> Personal Planner
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
            ))}
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="text-center py-24 glass-card bg-slate-50/50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800">
            <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-500 dark:text-slate-400 mb-2 font-display">Adventure awaits!</h3>
            <p className="text-slate-400 dark:text-slate-500">Generate your first AI roadmap to see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roadmaps.map((roadmap) => (
              <Link
                to={`/roadmap/${roadmap._id}`}
                key={roadmap._id}
                className="card-premium group"
              >
                <div className="flex flex-col h-full space-y-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold font-display group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
                      {roadmap.title}
                    </h3>
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 leading-relaxed flex-grow">
                    {roadmap.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      <span>Progression</span>
                      <span className="text-primary-500">{Math.round(roadmap.progress)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                      <motion.div
                        className="bg-primary-600 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${roadmap.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
