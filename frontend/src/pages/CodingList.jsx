import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Circle,
    Trophy,
    Target,
    Zap,
    Layout,
    ArrowUpRight,
    Code2,
    Sparkles,
    Loader2,
    Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProblems } from '../services/codingService';
import toast from 'react-hot-toast';

const CodingList = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pages: 1, currentPage: 1 });

    const currentTopic = searchParams.get('topic') || '';
    const currentDifficulty = searchParams.get('difficulty') || '';
    const currentSearch = searchParams.get('search') || '';
    const currentPage = parseInt(searchParams.get('page') || '1');

    const topics = ['Data Structures', 'Algorithms', 'Dynamic Programming', 'Graph Algorithms', 'Bit Manipulation'];
    const difficulties = ['Easy', 'Medium', 'Hard'];

    useEffect(() => {
        fetchProblems();
    }, [searchParams]);

    const fetchProblems = async () => {
        setLoading(true);
        try {
            const data = await getProblems({
                topic: currentTopic,
                difficulty: currentDifficulty,
                search: currentSearch,
                page: currentPage,
                limit: 15
            });
            setProblems(data.problems);
            setStats({
                total: data.total,
                pages: data.pages,
                currentPage: data.page
            });
        } catch (err) {
            toast.error('Failed to load problems');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const handlePageChange = (newPage) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', newPage.toString());
        setSearchParams(newParams);
    };

    const getDifficultyColor = (diff) => {
        switch (diff) {
            case 'Easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            case 'Hard': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative overflow-hidden">
            {/* Background Mesh */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-500/10 via-slate-950 to-slate-950 pointer-events-none z-0" />
            <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none z-0" />

            <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 text-primary-400"
                        >
                            <div className="p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                                <Code2 className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-black tracking-widest uppercase">Coding Arena</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-6xl font-black tracking-tighter text-white font-display"
                        >
                            Master the <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">Algorithm</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed"
                        >
                            Level up your coding skills with curated problems from FAANG-tier interviews.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl"
                    >
                        <button className="px-6 py-3 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary-500/20 hover:bg-primary-500 hover:scale-105 transition-all active:scale-95">
                            <Sparkles className="w-4 h-4" />
                            Recommended
                        </button>
                        <button className="px-6 py-3 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white/5">
                            All Problems
                        </button>
                    </motion.div>
                </div>

                {/* Filters Row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-900/40 p-2 rounded-3xl border border-white/5 backdrop-blur-md shadow-2xl"
                >
                    <div className="md:col-span-5 relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search problems by title..."
                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-primary-500/50 transition-all placeholder:text-slate-600 focus:ring-4 focus:ring-primary-500/10 text-white font-medium"
                            value={currentSearch}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>

                    <div className="md:col-span-3">
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <select
                                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-primary-500/50 transition-all text-slate-300 appearance-none font-medium cursor-pointer hover:bg-slate-900"
                                value={currentDifficulty}
                                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                            >
                                <option value="">All Difficulties</option>
                                {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="md:col-span-4 flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none px-2">
                        <button
                            onClick={() => handleFilterChange('topic', '')}
                            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${!currentTopic
                                    ? 'bg-white text-slate-950 border-white shadow-lg shadow-white/10 scale-105'
                                    : 'bg-slate-950/50 text-slate-500 hover:text-white border-white/5 hover:border-white/20'
                                }`}
                        >
                            All
                        </button>
                        {topics.map(t => (
                            <button
                                key={t}
                                onClick={() => handleFilterChange('topic', t)}
                                className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${currentTopic === t.toLowerCase() || currentTopic === t
                                        ? 'bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/20 scale-105'
                                        : 'bg-slate-950/50 text-slate-500 hover:text-white border-white/5 hover:border-white/20'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Problem Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-slate-900/30 border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm"
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">Loading Challenges...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-slate-950/50">
                                        <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest w-20">Status</th>
                                        <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Title</th>
                                        <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Difficulty</th>
                                        <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">Topic</th>
                                        <th className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest w-32 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <AnimatePresence>
                                        {problems.length > 0 ? (
                                            problems.map((problem, i) => (
                                                <motion.tr
                                                    key={problem._id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                                    onClick={() => problem.slug && navigate(`/coding/${problem.slug}`)}
                                                >
                                                    <td className="px-8 py-6">
                                                        {problem.isSolved ? (
                                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-colors">
                                                                <Circle className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-lg font-bold text-slate-200 group-hover:text-primary-400 transition-colors">
                                                                {problem.title}
                                                            </span>
                                                            {problem.isNew && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-400 uppercase tracking-wider mt-1">
                                                                    <Flame className="w-3 h-3 fill-current" /> New
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getDifficultyColor(problem.difficulty)}`}>
                                                            {problem.difficulty}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/50 text-[11px] font-bold text-slate-400 font-mono tracking-tighter capitalize border border-white/5">
                                                            {problem.topic}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="inline-flex items-center gap-2 text-primary-500 font-bold text-xs uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                            Solve <ArrowUpRight className="w-4 h-4" />
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        ) : (
                                            <motion.tr
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            >
                                                <td colSpan="5" className="px-6 py-32 text-center">
                                                    <div className="flex flex-col items-center gap-4 opacity-30">
                                                        <Target className="w-16 h-16" />
                                                        <p className="text-sm font-black uppercase tracking-widest">No challenges found matching your criteria</p>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>

                {/* Pagination */}
                {stats.pages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-8">
                        <button
                            disabled={stats.currentPage === 1}
                            onClick={() => handlePageChange(stats.currentPage - 1)}
                            className="p-3 border border-white/10 rounded-xl disabled:opacity-30 hover:bg-white/5 text-slate-400 transition-all hover:scale-105 active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-xl border border-white/5">
                            {Array.from({ length: stats.pages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => handlePageChange(p)}
                                    className={`w-10 h-10 rounded-lg text-xs font-black transition-all ${stats.currentPage === p
                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20 scale-110'
                                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={stats.currentPage === stats.pages}
                            onClick={() => handlePageChange(stats.currentPage + 1)}
                            className="p-3 border border-white/10 rounded-xl disabled:opacity-30 hover:bg-white/5 text-slate-400 transition-all hover:scale-105 active:scale-95"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodingList;
