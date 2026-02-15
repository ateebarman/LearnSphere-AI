import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { generateRoadmap, getUserRoadmaps } from '../services/roadmapService';
import { getAnalytics } from '../services/analyticsService';
import {
  Sparkles, Plus, Loader2, GraduationCap,
  BookOpen, Search, ArrowRight, BarChart3,
  BrainCircuit, Layout
} from 'lucide-react';
import { motion } from 'framer-motion';
import SkillTree from '../components/SkillTree';

const Dashboard = () => {
  const { userInfo } = useAuthStore();
  const [topic, setTopic] = useState('');
  const [roadmaps, setRoadmaps] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [roadmapsData, analyticsData] = await Promise.all([
          getUserRoadmaps(),
          getAnalytics()
        ]);
        setRoadmaps(roadmapsData);
        setAnalytics(analyticsData);
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

  return (
    <motion.div
      className="space-y-12 pb-20"
      variants={container}
      initial="initial"
      animate="animate"
    >
      {/* Welcome Section */}
      <motion.div variants={item} className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight">
          Welcome back, <span className="text-gradient leading-[1.2]">{userInfo?.name.split(' ')[0]}!</span>
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium font-display">
          Ready to hack your next skill today?
        </p>
      </motion.div>

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

          <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              className="form-input flex-grow text-lg py-4"
              placeholder="What do you want to master? (e.g. Advanced React, LLMs, Stoicism)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary px-8 text-lg font-bold min-w-[200px]"
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
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl text-sm font-bold font-display">
            <BarChart3 className="w-4 h-4 text-primary-500" />
            <span className="text-slate-600 dark:text-slate-300">{roadmaps.length} Roadmaps</span>
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
