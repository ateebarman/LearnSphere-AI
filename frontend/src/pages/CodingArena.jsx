import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Code2,
    Play,
    Send,
    Trophy,
    Zap,
    Clock,
    Terminal,
    Target,
    FileText,
    Settings,
    RotateCcw,
    Maximize2,
    ChevronDown,
    XCircle,
    Loader2,
    GripHorizontal,
    ArrowLeft,
    CheckCircle2,
    Bug,
    PanelLeft,
    PanelBottom,
    History,
    Copy,
    ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getProblemBySlug, runCode, submitCode, getProgress, getSubmissions } from '../services/codingService';
import { getProfile } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

const CodingArena = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { userInfo, setUserInfo } = useAuthStore();

    const [question, setQuestion] = useState(null);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState(null);
    const [progress, setProgress] = useState(null);
    const [timer, setTimer] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [activeCaseIndex, setActiveCaseIndex] = useState(0);
    const [submissions, setSubmissions] = useState([]);
    const [fetchingSubmissions, setFetchingSubmissions] = useState(false);

    // UI Tabs
    const [leftTab, setLeftTab] = useState('description');
    const [bottomTab, setBottomTab] = useState('testcase');
    const [mobileTab, setMobileTab] = useState('problem'); // 'problem', 'code', 'output'
    const [openMenu, setOpenMenu] = useState(null);

    // Resizable UI States
    const [consoleHeight, setConsoleHeight] = useState(300);
    const [leftPanelWidth, setLeftPanelWidth] = useState(450);
    const isResizingConsole = useRef(false);
    const isResizingLeft = useRef(false);
    const editorRef = useRef(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const languages = [
        { id: 'javascript', name: 'JavaScript' },
        { id: 'python', name: 'Python' },
        { id: 'cpp', name: 'C++' }
    ];

    useEffect(() => {
        if (slug) {
            fetchProblem();
        }
    }, [slug]);

    const fetchProblem = async () => {
        setLoading(true);
        try {
            const data = await getProblemBySlug(slug);
            setQuestion(data);
            fetchProgress(data.topic);

            // Log available starter codes for debugging
            if (data.starterCode) {
                console.log('Available languages:', Object.keys(data.starterCode));
            }
        } catch (err) {
            toast.error('Problem not found');
            navigate('/coding');
        } finally {
            setLoading(false);
        }
    };

    const fetchProgress = async (topic) => {
        try {
            const data = await getProgress(topic);
            setProgress(data[0] || null);
        } catch (err) {
            console.error('Progress fetch failed');
        }
    };

    const fetchSubmissions = async () => {
        if (!question?._id) return;
        setFetchingSubmissions(true);
        try {
            const data = await getSubmissions(question._id);
            setSubmissions(data || []);
        } catch (err) {
            console.error('Submissions fetch failed');
        } finally {
            setFetchingSubmissions(false);
        }
    };

    useEffect(() => {
        if (leftTab === 'submissions' && question?._id) {
            fetchSubmissions();
        }
    }, [leftTab, question?._id]);

    const getStarterCode = (lang) => {
        if (!question?.starterCode) return getDefaultTemplate(lang);

        // Case-insensitive lookup
        const key = Object.keys(question.starterCode).find(k => k.toLowerCase() === lang.toLowerCase());
        return key ? question.starterCode[key] : getDefaultTemplate(lang);
    };

    useEffect(() => {
        if (question) {
            const draft = localStorage.getItem(`draft_${slug}_${language}`);
            if (draft) {
                setCode(draft);
                toast.success(`Restored ${language} draft`, { duration: 2000, position: 'bottom-center' });
            } else {
                const template = getStarterCode(language);
                setCode(template);
            }
            setTimer(0);
            setIsTimerActive(true);
        }
    }, [question, language, slug]);

    // Save draft as the user types
    useEffect(() => {
        if (question && code && !loading) {
            localStorage.setItem(`draft_${slug}_${language}`, code);
        }
    }, [code, question, language, slug, loading]);


    useEffect(() => {
        if (isTimerActive) {
            const interval = setInterval(() => setTimer(t => t + 1), 1000);
            return () => clearInterval(interval);
        }
    }, [isTimerActive]);

    const getDefaultTemplate = (lang) => {
        const temps = {
            javascript: `class Solution {\n    /**\n     * @param {any} input\n     * @return {any}\n     */\n    solve(input) {\n        // Write your code here\n    }\n}`,
            python: `class Solution:\n    def solve(self, input):\n        # Write your code here\n        pass`,
            cpp: `class Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};`
        };
        return temps[lang];
    };

    // Resizing Logic
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizingConsole.current) {
                const newHeight = window.innerHeight - e.clientY - 40;
                if (newHeight > 100 && newHeight < window.innerHeight - 200) {
                    setConsoleHeight(newHeight);
                }
            }
            if (isResizingLeft.current) {
                const newWidth = e.clientX;
                if (newWidth > 300 && newWidth < window.innerWidth - 400) {
                    setLeftPanelWidth(newWidth);
                }
            }
        };

        const handleMouseUp = () => {
            isResizingConsole.current = false;
            isResizingLeft.current = false;
            document.body.style.cursor = 'default';
            if (editorRef.current) editorRef.current.layout();
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleRun = async () => {
        if (!question) return;
        setRunning(true);
        setBottomTab('testresult');
        if (isMobile) {
            setMobileTab('output');
        }
        try {
            const res = await runCode(question._id, code, language);
            setResults(res);
            const passed = res.filter(r => r.passed).length;
            if (passed === res.length) {
                toast.success(`Success! All sample cases passed`);
            } else {
                toast.error(`${res.length - passed} cases failed`);
            }
        } catch (err) {
            toast.error('Execution failed');
        } finally {
            setRunning(false);
        }
    };

    const handleSubmit = async () => {
        if (!question) return;
        setRunning(true);
        setBottomTab('testresult');
        if (isMobile) {
            setMobileTab('output');
        }
        try {
            const res = await submitCode(question._id, code, language, question.topic);
            setResults(res.status === 'Accepted' ? { status: 'Accepted', ...res } : (res.visibleResults || res.failedCases || res));
            if (res.status === 'Accepted') {
                toast.success('Accepted! All test cases passed.');
                setIsTimerActive(false);
                fetchProgress(question.topic);

                if (leftTab === 'submissions') {
                    fetchSubmissions();
                }

                // Refresh global streak
                const profile = await getProfile();
                setUserInfo(profile);
            } else {
                toast.error(`Wrong Answer: Only ${res.passed}/${res.total} passed.`);
            }
        } catch (err) {
            toast.error('Submission failed');
        } finally {
            setRunning(false);
        }
    };

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    };

    if (loading) {
        return (
            <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
                <span className="text-xs font-black tracking-widest uppercase animate-pulse">Initializing Environment...</span>
            </div>
        );
    }

    return (
        <div className="h-screen bg-slate-950 text-[#eff1f6] flex flex-col font-sans overflow-hidden font-display">
            {/* Nav Header */}
            <header className="h-14 border-b border-white/5 bg-slate-950 flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-2 md:gap-6">
                    <Link to="/coding" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest hidden min-[400px]:block">Exit</span>
                    </Link>

                    <div className="h-4 w-[1px] bg-slate-800 hidden md:block" />

                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                            <Code2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-500" />
                        </div>
                        <div>
                            <h1 className="text-xs md:text-sm font-bold text-white max-w-[100px] min-[400px]:max-w-[200px] truncate leading-tight">{question?.title}</h1>
                            <div className="flex items-center gap-2">
                                <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${question.difficulty === 'Easy' ? 'text-emerald-400' :
                                    question.difficulty === 'Medium' ? 'text-amber-400' :
                                        'text-rose-400'
                                    }`}>
                                    {question.difficulty}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-[11px] font-bold text-slate-300">{userInfo?.streak || 0} Day Streak</span>
                    </div>

                    <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        <Clock className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isTimerActive ? 'text-emerald-500 animate-pulse' : 'text-slate-500'}`} />
                        <span className="text-[10px] md:text-[11px] font-mono font-bold text-slate-300">{formatTime(timer)}</span>
                    </div>

                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 p-[1px] shadow-lg shadow-primary-500/20">
                        <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-[9px] md:text-[10px] font-black text-white uppercase">
                            {userInfo?.name?.charAt(0) || 'U'}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Tab Switcher */}
            <div className="lg:hidden flex border-b border-white/5 bg-slate-900/50">
                {[
                    { id: 'problem', label: 'Problem', icon: FileText },
                    { id: 'code', label: 'Code', icon: Code2 },
                    { id: 'output', label: 'Output', icon: Terminal }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setMobileTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-widest relative ${mobileTab === tab.id ? 'text-primary-400' : 'text-slate-500'}`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {mobileTab === tab.id && (
                            <motion.div layoutId="mobileTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Main Area */}
            <main className="flex-1 flex overflow-hidden lg:flex-row flex-col relative">
                {/* Left Panel */}
                <div
                    style={{ width: !isMobile ? leftPanelWidth : '100%' }}
                    className={`lg:flex flex-col border-r border-white/5 bg-slate-950 flex-shrink-0 ${isMobile ? 'flex-1' : ''} ${mobileTab === 'problem' ? 'flex' : 'hidden'}`}
                >
                    <div className="flex items-center bg-slate-900/50 px-2 h-10 border-b border-white/5 gap-1">
                        {['description', 'editorial', 'submissions'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setLeftTab(tab)}
                                className={`px-4 h-full text-[11px] font-bold capitalize flex items-center gap-2 transition-all relative rounded-t-lg mx-0.5 ${leftTab === tab
                                    ? 'text-white bg-slate-800/50'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                                    }`}
                            >
                                {tab === 'description' && <FileText className="w-3.5 h-3.5" />}
                                {tab === 'editorial' && <Trophy className="w-3.5 h-3.5" />}
                                {tab === 'submissions' && <History className="w-3.5 h-3.5" />}
                                {tab}
                                {leftTab === tab && (
                                    <motion.div layoutId="activeTabL" className="absolute bottom-0 left-0 w-full h-[1px] bg-primary-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar scroll-smooth will-change-transform">
                        {leftTab === 'description' && question ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <h1 className="text-2xl font-black text-white">{question.title}</h1>
                                        <div className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 uppercase tracking-tight">
                                            {question.topic}
                                        </div>
                                    </div>

                                    <div className="prose prose-invert prose-sm max-w-none text-slate-300/90 leading-relaxed font-sans prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-white/5 prose-code:text-primary-300">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {question.problemStatement}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {(question.examples?.length > 0 ? question.examples : question.visibleTestCases?.slice(0, 3).map(tc => ({
                                        input: tc.input,
                                        output: tc.expectedOutput,
                                        explanation: ''
                                    })))?.map((ex, i) => (
                                        <div key={i} className="group">
                                            <h4 className="text-[13px] font-bold text-slate-300 mb-2 flex items-center gap-2">
                                                Example {i + 1}:
                                            </h4>
                                            <div className="bg-slate-900/40 border border-white/5 rounded-xl p-5 font-mono text-[13px] space-y-4 shadow-xl shadow-black/20 group-hover:border-primary-500/20 transition-all">
                                                <div className="flex gap-4">
                                                    <span className="text-slate-400 font-black uppercase text-[10px] w-20 flex-shrink-0 pt-0.5">Input</span>
                                                    <div className="text-white bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 flex-1 break-all">{ex.input}</div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <span className="text-slate-400 font-black uppercase text-[10px] w-20 flex-shrink-0 pt-0.5">Output</span>
                                                    <div className="text-emerald-400 bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-500/10 flex-1 font-bold break-all shadow-[0_0_15px_-5px_rgba(52,211,153,0.1)]">{ex.output}</div>
                                                </div>
                                                {ex.explanation && (
                                                    <div className="flex gap-4 pt-2 border-t border-white/5">
                                                        <span className="text-slate-400 font-black uppercase text-[10px] w-20 flex-shrink-0 pt-0.5">Explanation</span>
                                                        <div className="text-slate-400 text-sm italic leading-relaxed flex-1">{ex.explanation}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-white/5">
                                    <h4 className="text-[11px] font-black mb-4 uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                        <Bug className="w-3 h-3" /> Constraints
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {question.constraints.map((c, i) => (
                                            <div key={i} className="flex items-center gap-3 text-[12px] font-mono text-slate-400 bg-slate-900/30 px-3 py-2 rounded-lg border border-white/5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                                {c}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ) : leftTab === 'submissions' ? (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <History className="w-5 h-5 text-primary-500" />
                                        Submissions
                                    </h2>
                                    <button
                                        onClick={fetchSubmissions}
                                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                                        title="Refresh"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                </div>

                                {fetchingSubmissions ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                        <Loader2 className="w-8 h-8 animate-spin mb-3" />
                                        <span className="text-xs uppercase font-black tracking-widest animate-pulse">Fetching History...</span>
                                    </div>
                                ) : submissions.length > 0 ? (
                                    <div className="space-y-3">
                                        {submissions.map((sub, i) => (
                                            <div
                                                key={sub._id}
                                                className="bg-slate-900/50 border border-white/5 rounded-xl p-4 hover:border-primary-500/30 transition-all group relative overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between mb-3 relative z-10">
                                                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${sub.status === 'Accepted'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                        }`}>
                                                        {sub.status}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                        {new Date(sub.createdAt).toLocaleDateString()} {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-slate-800 rounded-lg">
                                                            <Code2 className="w-3 h-3 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase text-slate-600 tracking-tighter">Language</p>
                                                            <p className="text-[11px] font-bold text-slate-300 uppercase">{sub.language}</p>
                                                        </div>
                                                    </div>
                                                    {sub.runtime && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-slate-800 rounded-lg">
                                                                <Clock className="w-3 h-3 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase text-slate-600 tracking-tighter">Runtime</p>
                                                                <p className="text-[11px] font-bold text-slate-300">{sub.runtime}ms</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        const lang = sub.language.toLowerCase() === 'c++' ? 'cpp' : sub.language.toLowerCase();
                                                        setLanguage(lang);
                                                        // Use a short delay or ensure the effect doesn't overwrite it
                                                        setTimeout(() => setCode(sub.code), 10);
                                                        toast.success(`Restored ${sub.language} version`);
                                                    }}
                                                    className="w-full py-2 bg-slate-800 hover:bg-primary-600 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700 hover:border-primary-500 relative z-10"
                                                >
                                                    View & Restore Code
                                                </button>

                                                {/* Background Accent */}
                                                <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 rounded-full -mr-12 -mt-12 transition-colors ${sub.status === 'Accepted' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-40">
                                        <History className="w-12 h-12 mb-3" />
                                        <p className="text-xs font-black uppercase tracking-widest">No Submissions Yet</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-20">
                                <FileText className="w-16 h-16 mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">Select a Tab</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resizer Handle */}
                <div
                    className="hidden lg:flex w-1 cursor-col-resize hover:bg-primary-500 transition-colors bg-black/50 border-r border-white/5 border-l border-white/5 z-20 flex-col justify-center items-center group"
                    onMouseDown={() => isResizingLeft.current = true}
                >
                    <div className="h-8 w-0.5 bg-slate-700 rounded-full group-hover:bg-white transition-colors" />
                </div>

                <div className={`flex-1 flex flex-col min-w-0 bg-[#0d1117] ${mobileTab === 'code' ? 'flex' : 'hidden lg:flex'}`}>
                    {/* Editor Header */}
                    <div className="flex items-center justify-between px-4 h-12 border-b border-white/5 bg-slate-900/30">
                        <div className="flex items-center gap-4 h-full">
                            <div className="relative group">
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="appearance-none bg-white/5 border border-white/5 hover:border-white/10 rounded-lg pl-9 pr-8 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary-500/50 cursor-pointer transition-colors"
                                >
                                    {languages.map(lang => (
                                        <option key={lang.id} value={lang.id} className="bg-slate-900 text-slate-300 py-2">
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <div className={`w-2 h-2 rounded-full ${language === 'javascript' ? 'bg-yellow-400' :
                                        language === 'python' ? 'bg-blue-400' : 'bg-pink-400'
                                        }`} />
                                </div>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none group-hover:text-slate-300 transition-colors" />
                            </div>

                            <div className="h-4 w-[1px] bg-white/10" />

                            <button
                                onClick={() => {
                                    if (question) {
                                        const template = question.starterCode?.[language] || getDefaultTemplate(language);
                                        setCode(template);
                                        toast('Code Reset to Default', { icon: '🔄', style: { background: '#1e293b', color: '#fff', fontSize: '12px' } });
                                    }
                                }}
                                className="text-slate-500 text-[11px] font-bold hover:text-white transition-colors flex items-center gap-1.5 group"
                            >
                                <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500" />
                                Reset
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            {isMobile && (
                                <>
                                    <button
                                        onClick={handleRun}
                                        disabled={running || !question}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all disabled:opacity-50"
                                        title="Run Code"
                                    >
                                        {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={running || !question}
                                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg border border-emerald-500 transition-all disabled:opacity-50"
                                        title="Submit Code"
                                    >
                                        {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    </button>
                                </>
                            )}
                            <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 relative min-h-0 bg-[#0d1117]">
                        {/* Subtle Background Mesh for Editor Area */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20" />

                        <Editor
                            key={language} // Force re-mount on language change to ensure clean state
                            height="100%"
                            language={language}
                            theme="vs-dark"
                            value={code}
                            onChange={setCode}
                            onMount={(editor) => editorRef.current = editor}
                            options={{
                                fontSize: isMobile ? 13 : 14,
                                minimap: { enabled: false },
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                fontLigatures: true,
                                padding: { top: 16, bottom: 16 },
                                scrollBeyondLastLine: false,
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                lineNumbersMinChars: isMobile ? 2 : 3,
                                renderLineHighlight: 'all',
                                wordWrap: 'on',
                                folding: !isMobile,
                                lineNumbers: isMobile ? 'on' : 'on', // Keeping it for now but could turn off if too crowded
                                scrollbar: {
                                    verticalScrollbarSize: 8,
                                    horizontalScrollbarSize: 8,
                                    useShadows: false
                                },
                            }}
                        />
                    </div>

                    {/* Console Resizer */}
                    <div
                        className="hidden lg:flex h-1 cursor-row-resize bg-black/50 hover:bg-primary-500 transition-colors flex items-center justify-center relative z-20 border-t border-b border-white/5 group"
                        onMouseDown={() => isResizingConsole.current = true}
                    >
                        <div className="w-12 h-1 bg-slate-700 rounded-full group-hover:bg-white transition-colors opacity-0 group-hover:opacity-100" />
                    </div>

                    {/* Bottom Console Panel */}
                    <div
                        style={{ height: !isMobile ? consoleHeight : 'auto' }}
                        className={`lg:flex flex-col bg-slate-950 border-t border-white/5 shadow-2xl z-10 ${mobileTab === 'output' ? 'flex-1 flex' : 'hidden'}`}
                    >
                        <div className="flex items-center justify-between px-4 h-11 border-b border-white/5 bg-slate-900/40">
                            <div className="flex items-center gap-1 h-full">
                                <button
                                    onClick={() => setBottomTab('testcase')}
                                    className={`px-4 h-full text-[11px] font-bold uppercase flex items-center gap-2 relative transition-all rounded-t-lg mx-0.5 ${bottomTab === 'testcase'
                                        ? 'text-white bg-slate-800/30'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    <Target className={`w-3.5 h-3.5 ${bottomTab === 'testcase' ? 'text-emerald-500' : ''}`} />
                                    Testcases
                                    {bottomTab === 'testcase' && <motion.div layoutId="activeTabB" className="absolute bottom-0 left-0 w-full h-[1px] bg-emerald-500" />}
                                </button>
                                <button
                                    onClick={() => setBottomTab('testresult')}
                                    className={`px-4 h-full text-[11px] font-bold uppercase flex items-center gap-2 relative transition-all rounded-t-lg mx-0.5 ${bottomTab === 'testresult'
                                        ? 'text-white bg-slate-800/30'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    <Terminal className={`w-3.5 h-3.5 ${bottomTab === 'testresult' ? 'text-primary-500' : ''}`} />
                                    Output
                                    {bottomTab === 'testresult' && <motion.div layoutId="activeTabB" className="absolute bottom-0 left-0 w-full h-[1px] bg-primary-500" />}
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleRun}
                                    disabled={running || !question}
                                    className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-wider rounded-lg border border-slate-700 hover:border-slate-600 transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
                                >
                                    {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                    Run Code
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={running || !question}
                                    className={`px-5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg active:scale-95 ${running
                                        ? 'bg-emerald-900/20 text-emerald-500 border-emerald-900/50'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 hover:border-emerald-400 shadow-emerald-900/20'
                                        }`}
                                >
                                    {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                    Submit
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/50">
                            <AnimatePresence mode="wait">
                                {bottomTab === 'testcase' && question ? (
                                    <motion.div
                                        key="testcase"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex gap-4">
                                            {(question.visibleTestCases || []).map((tc, i) => (
                                                <div key={i} className="group relative">
                                                    <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded opacity-0 transition duration-500 ${activeCaseIndex === i ? 'opacity-100 blur-sm' : 'group-hover:opacity-20 blur'}`} />
                                                    <button
                                                        onClick={() => setActiveCaseIndex(i)}
                                                        className={`relative px-6 py-3 border rounded-lg text-left hover:-translate-y-1 transition-transform w-[140px] ${activeCaseIndex === i ? 'bg-slate-900 border-emerald-500/50' : 'bg-slate-900 border-slate-800'}`}
                                                    >
                                                        <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${activeCaseIndex === i ? 'text-emerald-400' : 'text-slate-500'}`}>Case {i + 1}</div>
                                                        <div className="font-mono text-[11px] text-slate-300 truncate">
                                                            {typeof tc.input === 'object' ? JSON.stringify(tc.input) : tc.input}
                                                        </div>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Case Details</span>
                                                <span className="text-[10px] font-mono text-slate-600">Index: {activeCaseIndex}</span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-1.5">
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Input</span>
                                                    <div className="text-[12px] p-3 bg-slate-900/50 border border-white/5 text-slate-300 rounded-lg font-mono overflow-auto custom-scrollbar max-h-[100px]">
                                                        {(() => {
                                                            const val = question.visibleTestCases?.[activeCaseIndex]?.input;
                                                            return typeof val === 'object' ? JSON.stringify(val, null, 2) : val;
                                                        })()}
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Expected Output</span>
                                                    <div className="text-[12px] p-3 bg-emerald-950/10 border border-emerald-900/20 text-emerald-500/70 rounded-lg font-mono overflow-auto custom-scrollbar max-h-[100px]">
                                                        {(() => {
                                                            const val = question.visibleTestCases?.[activeCaseIndex]?.expectedOutput;
                                                            return typeof val === 'object' ? JSON.stringify(val, null, 2) : val;
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : bottomTab === 'testresult' ? (
                                    <motion.div
                                        key="testresult"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-6 pb-4"
                                    >
                                        {!results ? (
                                            <div className="flex flex-col items-center justify-center py-10 text-slate-600 font-bold text-xs tracking-widest uppercase opacity-40">
                                                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                                                    <Terminal className="w-8 h-8" />
                                                </div>
                                                Waiting for Execution...
                                            </div>
                                        ) : Array.isArray(results) ? (
                                            <div className="space-y-4">
                                                {results.map((r, i) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        key={i}
                                                        className={`p-1 rounded-xl bg-gradient-to-br ${r.passed ? 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20' : 'from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20'} border`}
                                                    >
                                                        <div className="bg-slate-950/80 rounded-lg p-5">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-2 h-2 rounded-full ${r.passed ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} />
                                                                    <span className="text-[11px] font-black text-slate-400 tracking-tighter uppercase">CASE {i + 1}</span>
                                                                    <div className={`text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase border ${r.passed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                                                        {(!r.passed && r.status === 'Accepted') ? 'Wrong Answer' : r.status}
                                                                    </div>
                                                                </div>
                                                                {r.time && <span className="text-[10px] text-slate-600 font-mono font-bold tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.round(r.time * 100)} MS</span>}
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-1.5">
                                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Input</span>
                                                                    <div className="text-[12px] p-3 bg-black/40 border border-white/5 text-slate-400 rounded-lg font-mono overflow-auto custom-scrollbar">{r.input}</div>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Expected</span>
                                                                    <div className="text-[12px] p-3 bg-emerald-950/10 border border-emerald-900/20 text-emerald-500/70 rounded-lg font-mono overflow-auto custom-scrollbar">{r.expected}</div>
                                                                </div>
                                                                <div className="space-y-1.5 md:col-span-2">
                                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Output</span>
                                                                    <div className={`text-[12px] p-3 rounded-lg border font-mono overflow-auto custom-scrollbar ${r.passed ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' : 'bg-rose-950/20 border-rose-500/20 text-rose-400'}`}>
                                                                        {r.actual || (r.status === 'Runtime Error (NZEC)' ? '[PROCESS TERMINATED WITHOUT OUTPUT]' : '[NO OUTPUT]')}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {(r.stderr || r.compile_output) && (
                                                                <div className="mt-4 p-3 bg-black/60 rounded border border-rose-900/30 text-rose-300 font-mono text-[11px] whitespace-pre-wrap relative group/error">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-2 text-rose-500 font-bold uppercase text-[9px] tracking-widest">
                                                                            <Bug className="w-3 h-3" />
                                                                            {r.compile_output ? 'Compilation Error' : 'Runtime Error Details'}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                navigator.clipboard.writeText(r.stderr || r.compile_output);
                                                                                toast.success('Error copied to clipboard');
                                                                            }}
                                                                            className="opacity-0 group-hover/error:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white"
                                                                            title="Copy Error"
                                                                        >
                                                                            <Copy className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                                                        {r.stderr || r.compile_output}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : results.status === 'Accepted' ? (
                                            <motion.div
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="p-10 bg-gradient-to-br from-emerald-500/10 via-emerald-900/5 to-transparent border border-emerald-500/10 rounded-2xl text-center relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-50 blur-xl" />
                                                <motion.div
                                                    initial={{ y: 20 }}
                                                    animate={{ y: 0 }}
                                                    className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)] border border-emerald-500/20"
                                                >
                                                    <Trophy className="text-emerald-400 w-12 h-12 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                                </motion.div>
                                                <h3 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter drop-shadow-lg">Accepted</h3>
                                                <p className="text-sm text-emerald-400/80 font-bold uppercase tracking-widest py-4">All test cases passed successfully.</p>
                                                <button onClick={() => navigate('/coding')} className="px-8 py-3 bg-white text-emerald-950 hover:bg-emerald-50 rounded-lg font-black uppercase text-[11px] tracking-widest transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                                                    Continue Journey
                                                </button>

                                                {results.visibleResults && (
                                                    <div className="mt-8 pt-8 border-t border-white/5 text-left">
                                                        <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Visible Test Cases Details</h4>
                                                        <div className="space-y-3">
                                                            {results.visibleResults.map((r, i) => (
                                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-white/5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                        <span className="text-[11px] font-bold text-slate-300">Case {i + 1}</span>
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase text-emerald-400">PASSED</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <div className="p-8 bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/10 rounded-xl">
                                                <div className="flex items-center gap-6 mb-4">
                                                    <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20">
                                                        <XCircle className="text-rose-500 w-8 h-8" />
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-black text-white tracking-tighter uppercase italic">{results.status}</div>
                                                        <div className="text-[11px] text-rose-400/60 font-black tracking-widest uppercase mt-1">Check hidden test cases & constraints</div>
                                                    </div>
                                                </div>
                                                <div className="h-1 w-full bg-rose-950/30 rounded-full overflow-hidden">
                                                    <div style={{ width: `${(results.passed / results.total) * 100}%` }} className="h-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
                                                </div>
                                                <div className="flex justify-between mt-2 text-[10px] font-mono font-bold text-rose-500/50">
                                                    <span>{results.passed} PASS</span>
                                                    <span>{results.total} TOTAL</span>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 opacity-20">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
                
                .monaco-editor .scroll-decoration { box-shadow: none !important; }
                .monaco-editor { background-color: transparent !important; }
                .monaco-editor .margin { background-color: transparent !important; }
                `}} />
        </div>
    );
};

export default CodingArena;
