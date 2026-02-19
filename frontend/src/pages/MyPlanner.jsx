import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, BookOpen, Link2, Search, Trash,
    Layout, Calendar, Target, Clock, Zap, BookMarked,
    Globe, Lock, Play, Sparkles, Plus, Loader2, Trash2, Edit3, Save, X, Target as TargetIcon
} from 'lucide-react';
import {
    getUserRoadmaps, getRoadmapPreview, createRoadmap, updateRoadmap,
    deleteRoadmap, toggleRoadmapVisibility
} from '../services/roadmapService';
import { getProblems } from '../services/codingService';
import { getKnowledgeNodes } from '../services/knowledgeService';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const MyPlanner = () => {
    const [roadmaps, setRoadmaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [topic, setTopic] = useState('');

    const [difficulty, setDifficulty] = useState('Intermediate');
    const [targetRole, setTargetRole] = useState('');
    // Editor State
    const [editingRoadmap, setEditingRoadmap] = useState(null);
    const [problems, setProblems] = useState([]);
    const [knowledge, setKnowledge] = useState([]);

    const defaultModule = {
        title: '', description: '', estimatedTime: '', difficulty: 'Intermediate',
        objectives: [''], keyConcepts: [''],
        practiceProblems: [{ title: '', url: '', difficulty: 'Medium', source: 'external' }],
        learningResources: [{ title: '', url: '', type: 'doc', source: 'external' }],
        quizConfig: { autoGenerate: true, topic: '', questionCount: 5 },
        effortEstimate: { readingMinutes: 30, practiceMinutes: 45, assessmentMinutes: 15 },
        interviewImportance: 'Medium', conceptWeight: 5,
        unlockCriteria: { masteryThreshold: 0, quizScore: 0, problemsSolved: 0 },
    };

    useEffect(() => {
        fetchRoadmaps();
        fetchResources();
    }, []);

    const fetchRoadmaps = async () => {
        try {
            const data = await getUserRoadmaps();
            setRoadmaps(data);
        } catch (err) {
            toast.error('Failed to load your planner');
        } finally {
            setLoading(false);
        }
    };

    const fetchResources = async () => {
        try {
            const [p, k] = await Promise.all([getProblems(), getKnowledgeNodes()]);
            setProblems(Array.isArray(p) ? p : (p?.problems || []));
            setKnowledge(Array.isArray(k) ? k : (k?.nodes || []));
        } catch (err) { }
    };

    const handleGenerate = async () => {
        if (!topic.trim()) return toast.error('Enter a goal (e.g., Backend Developer)');
        setGenerating(true);
        const tid = toast.loading('Architecting your superior plan...');
        try {
            const data = await getRoadmapPreview(topic, difficulty, targetRole);
            setEditingRoadmap({
                ...data,
                topic: topic,
                isPublic: false // Private by default
            });
            setTopic('');
            toast.success('Superior Roadmap Draft ready! Review and Publish.', { id: tid });
        } catch (err) {
            toast.error('AI Generation failed. Try a different topic.', { id: tid });
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this roadmap from your planner?')) return;
        try {
            await deleteRoadmap(id);
            setRoadmaps(roadmaps.filter(r => r._id !== id));
            toast.success('Roadmap removed');
        } catch (err) {
            toast.error('Failed to remove');
        }
    };

    const handleSave = async () => {
        const tid = toast.loading('Saving your planner...');
        try {
            let savedData;
            if (editingRoadmap._id) {
                // Update existing
                savedData = await updateRoadmap(editingRoadmap._id, editingRoadmap);
                setRoadmaps(roadmaps.map(r => r._id === savedData._id ? savedData : r));
            } else {
                // Create new
                savedData = await createRoadmap(editingRoadmap);
                setRoadmaps([savedData, ...roadmaps]);
            }
            setEditingRoadmap(null);
            toast.success('Planner saved!', { id: tid });
        } catch (err) {
            toast.error('Failed to save changes', { id: tid });
        }
    };

    // Hydrate a roadmap from DB with defaults so the editor works for all fields
    const handleEdit = (roadmap) => {
        setEditingRoadmap({
            ...roadmap,
            learningGoals: roadmap.learningGoals?.length ? roadmap.learningGoals : [''],
            targetRoles: roadmap.targetRoles?.length ? roadmap.targetRoles : [''],
            expectedOutcomes: roadmap.expectedOutcomes?.length ? roadmap.expectedOutcomes : [''],
            skillsCovered: roadmap.skillsCovered?.length ? roadmap.skillsCovered : [''],
            prerequisites: roadmap.prerequisites?.length ? roadmap.prerequisites : [''],
            modules: (roadmap.modules || []).map(m => ({
                ...m,
                objectives: m.objectives?.length ? m.objectives : [''],
                keyConcepts: m.keyConcepts?.length ? m.keyConcepts : [''],
                practiceProblems: m.practiceProblems?.length ? m.practiceProblems : [],
                learningResources: m.learningResources?.length ? m.learningResources.map(lr => ({ ...lr, source: lr.source || 'external' })) : [],
                quizConfig: m.quizConfig || { autoGenerate: true, topic: m.title || '', questionCount: 5 },
                effortEstimate: m.effortEstimate || { readingMinutes: 30, practiceMinutes: 45, assessmentMinutes: 15 },
                interviewImportance: m.interviewImportance || 'Medium',
                conceptWeight: m.conceptWeight || 5,
                unlockCriteria: m.unlockCriteria || { masteryThreshold: 0, quizScore: 0, problemsSolved: 0 },
            }))
        });
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 pb-20">
            {/* Header */}
            <header className="bg-slate-900/50 border-b border-white/5 pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6 md:space-y-6">
                    {/* Title Row — matches reference: title + count on left, Create button on right */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-1 flex items-center gap-2 md:gap-3">
                                My Learning <span className="text-primary-500">Planner</span>
                            </h1>
                            <p className="text-slate-500 text-xs md:text-sm">{roadmaps.length} roadmap{roadmaps.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button
                            onClick={() => setEditingRoadmap({
                                title: 'My Custom Path', topic: 'General', description: '', difficulty: 'Beginner', totalDuration: '',
                                learningGoals: [''], targetRoles: [''], expectedOutcomes: [''], skillsCovered: [''], prerequisites: [''],
                                modules: [{ ...defaultModule, title: 'Foundations' }],
                                isPublic: false
                            })}
                            className="w-full sm:w-auto bg-primary-600 hover:bg-primary-500 text-white font-black uppercase tracking-widest text-[9px] md:text-[10px] px-5 md:px-6 py-3 md:py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-600/20"
                        >
                            <Plus className="w-4 h-4" /> Create Roadmap
                        </button>
                    </div>

                    {/* AI Roadmap Generator Bar */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 md:gap-4 bg-slate-900/50 p-4 md:p-4 rounded-2xl border border-white/5 shadow-xl backdrop-blur-xl">
                        <div className="flex items-center gap-2 mr-2">
                            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                            <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest">AI Generator</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <input
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                placeholder="e.g. React, System Design..."
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500/50 transition-all placeholder:text-slate-600"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <select
                                value={difficulty}
                                onChange={e => setDifficulty(e.target.value)}
                                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none cursor-pointer min-w-[120px]"
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>

                            <input
                                value={targetRole}
                                onChange={e => setTargetRole(e.target.value)}
                                placeholder="Target Role (e.g. SDE-1)"
                                className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none flex-grow sm:w-48 placeholder:text-slate-600"
                            />

                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="bg-primary-600 hover:bg-primary-500 text-white font-black uppercase tracking-widest text-[10px] px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-primary-600/20 min-w-[140px]"
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {generating ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>


            <main className="max-w-7xl mx-auto px-4 md:px-6 mt-8 pb-20 space-y-8">

                {/* Inline Editor Form (Admin-Style) */}
                <AnimatePresence>
                    {editingRoadmap && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="bg-slate-900/70 border border-white/5 rounded-2xl p-6 space-y-6 overflow-hidden"
                        >
                            {/* Form Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-white">
                                    {editingRoadmap._id ? 'Edit Roadmap' : 'Create Roadmap'}
                                </h3>
                                <div className="flex items-center gap-2">
                                    {editingRoadmap._id && (
                                        <button onClick={() => setEditingRoadmap(null)}
                                            className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Cancel Edit</button>
                                    )}
                                    <button onClick={() => setEditingRoadmap(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Title" value={editingRoadmap.title} onChange={v => setEditingRoadmap({ ...editingRoadmap, title: v })} placeholder="React Mastery Roadmap" />
                                <InputField label="Topic" value={editingRoadmap.topic} onChange={v => setEditingRoadmap({ ...editingRoadmap, topic: v })} placeholder="Web Development" />
                            </div>
                            <TextArea label="Description" value={editingRoadmap.description} onChange={v => setEditingRoadmap({ ...editingRoadmap, description: v })} rows={3} placeholder="A comprehensive roadmap to master..." />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Difficulty</label>
                                    <select value={editingRoadmap.difficulty} onChange={e => setEditingRoadmap({ ...editingRoadmap, difficulty: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-3 text-sm text-white focus:outline-none">
                                        <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                                    </select>
                                </div>
                                <InputField label="Total Duration" value={editingRoadmap.totalDuration} onChange={v => setEditingRoadmap({ ...editingRoadmap, totalDuration: v })} placeholder="6 Weeks" />
                                <InputField label="Tags (comma-separated)" value={Array.isArray(editingRoadmap.tags) ? editingRoadmap.tags.join(', ') : (editingRoadmap.tags || '')} onChange={v => setEditingRoadmap({ ...editingRoadmap, tags: v })} placeholder="react, hooks, frontend" />
                            </div>

                            {/* Enhanced Metadata */}
                            <div className="border-t border-white/5 pt-4 space-y-4">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Learning Intelligence</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <ArrayField label="Learning Goals" items={editingRoadmap.learningGoals || ['']} onChange={v => setEditingRoadmap({ ...editingRoadmap, learningGoals: v })} />
                                    <ArrayField label="Target Roles" items={editingRoadmap.targetRoles || ['']} onChange={v => setEditingRoadmap({ ...editingRoadmap, targetRoles: v })} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <ArrayField label="Expected Outcomes" items={editingRoadmap.expectedOutcomes || ['']} onChange={v => setEditingRoadmap({ ...editingRoadmap, expectedOutcomes: v })} />
                                    <ArrayField label="Skills Covered" items={editingRoadmap.skillsCovered || ['']} onChange={v => setEditingRoadmap({ ...editingRoadmap, skillsCovered: v })} />
                                </div>
                                <ArrayField label="Prerequisites" items={editingRoadmap.prerequisites || ['']} onChange={v => setEditingRoadmap({ ...editingRoadmap, prerequisites: v })} />
                            </div>

                            {/* Modules */}
                            <div className="border-t border-white/5 pt-4">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Modules ({editingRoadmap.modules.length})</label>
                                {editingRoadmap.modules.map((mod, i) => (
                                    <ModuleEditor
                                        key={i}
                                        index={i}
                                        module={mod}
                                        problems={problems}
                                        knowledge={knowledge}
                                        onChange={updatedMod => {
                                            const n = [...editingRoadmap.modules];
                                            n[i] = updatedMod;
                                            setEditingRoadmap({ ...editingRoadmap, modules: n });
                                        }}
                                        onRemove={() => {
                                            const n = editingRoadmap.modules.filter((_, idx) => idx !== i);
                                            setEditingRoadmap({ ...editingRoadmap, modules: n });
                                        }}
                                        onMoveUp={() => {
                                            if (i === 0) return;
                                            const n = [...editingRoadmap.modules];
                                            [n[i - 1], n[i]] = [n[i], n[i - 1]];
                                            setEditingRoadmap({ ...editingRoadmap, modules: n });
                                        }}
                                        onMoveDown={() => {
                                            if (i === editingRoadmap.modules.length - 1) return;
                                            const n = [...editingRoadmap.modules];
                                            [n[i], n[i + 1]] = [n[i + 1], n[i]];
                                            setEditingRoadmap({ ...editingRoadmap, modules: n });
                                        }}
                                    />
                                ))}

                                <button onClick={() => setEditingRoadmap({
                                    ...editingRoadmap,
                                    modules: [...editingRoadmap.modules, { ...defaultModule }]
                                })}
                                    className="w-full mt-4 py-3 bg-slate-800 border border-white/5 text-slate-400 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-700 hover:text-white transition-all">
                                    + Add Manual Module
                                </button>
                            </div>

                            <button onClick={handleSave}
                                className={`w-full py-4 ${editingRoadmap._id ? 'bg-amber-600 shadow-amber-500/20' : 'bg-emerald-600 shadow-emerald-500/20'} text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg`}>
                                <Save className="w-4 h-4" /> {editingRoadmap._id ? 'Update Roadmap' : 'Publish Roadmap'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Roadmap Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {roadmaps.length === 0 && !editingRoadmap && (
                        <div className="col-span-full text-center py-20">
                            <div className="w-16 h-16 rounded-2xl bg-slate-900/50 flex items-center justify-center mx-auto mb-4 border border-white/5">
                                <BookOpen className="w-8 h-8 text-slate-600" />
                            </div>
                            <p className="text-slate-500 font-bold mb-2">No roadmaps yet</p>
                            <p className="text-slate-600 text-sm">Use the AI Generator above or click "Create Roadmap" to get started.</p>
                        </div>
                    )}
                    {roadmaps.map(r => (
                        <div key={r._id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-primary-500/20 transition-all group">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">{r.title}</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{r.topic} • {r.difficulty}</p>
                                </div>
                                <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => handleEdit(r)}
                                        className="p-2 text-primary-400 hover:bg-primary-500/10 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(r._id)}
                                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mb-3 line-clamp-2">{r.description || 'No description'}</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                    <span>{r.modules?.length || 0} modules</span>
                                    <span>•</span>
                                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                </div>
                                <Link to={`/roadmap/${r._id}`}
                                    className="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
                                    Open <ChevronRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

// --- Subcomponents ---

const InputField = ({ label, value, onChange, placeholder }) => (
    <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</label>
        <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50 transition-all" />
    </div>
);

const EditorField = ({ label, value, onChange, placeholder }) => (
    <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
        <input
            value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500/50 transition-all shadow-inner"
        />
    </div>
);

const TextArea = ({ label, value, onChange, placeholder, rows = 3 }) => (
    <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
        <textarea
            value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
            className="bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-primary-500/50 transition-all shadow-inner resize-none"
        />
    </div>
);

const EditorSelect = ({ label, value, options, onChange }) => (
    <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
        <select
            value={value} onChange={e => onChange(e.target.value)}
            className="bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500/50 transition-all shadow-inner appearance-none cursor-pointer"
        >
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
);

const ArrayField = ({ label, items, onChange }) => (
    <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</label>
        {(items || ['']).map((v, i) => (
            <div key={i} className="flex gap-2 mb-2">
                <input value={v} onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n); }}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50" />
                <button onClick={() => onChange(items.filter((_, j) => j !== i))}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><X className="w-3 h-3" /></button>
            </div>
        ))}
        <button onClick={() => onChange([...(items || []), ''])}
            className="text-[10px] text-primary-400 font-bold uppercase tracking-widest hover:text-white transition-colors">+ Add</button>
    </div>
);

const ModuleEditor = ({ index, module, problems: rawProblems, knowledge: rawKnowledge, onChange, onRemove, onMoveUp, onMoveDown }) => {
    const problems = Array.isArray(rawProblems) ? rawProblems : [];
    const knowledge = Array.isArray(rawKnowledge) ? rawKnowledge : [];
    const updateField = (key, val) => onChange({ ...module, [key]: val });

    return (
        <div className="bg-black/20 rounded-xl p-5 space-y-4 border border-white/5">
            {/* Module Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary-600/20 border border-primary-500/20 flex items-center justify-center text-xs font-black text-primary-400">{index + 1}</span>
                    <span className="text-xs font-black text-white">{module.title || `Module ${index + 1}`}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onMoveUp} className="p-1.5 text-slate-600 hover:text-white rounded-lg text-xs">↑</button>
                    <button onClick={onMoveDown} className="p-1.5 text-slate-600 hover:text-white rounded-lg text-xs">↓</button>
                    <button onClick={onRemove} className="text-rose-500 text-[10px] hover:bg-rose-500/10 px-2 py-1 rounded">Remove</button>
                </div>
            </div>

            {/* Basic module info */}
            <div className="grid grid-cols-3 gap-3">
                <input value={module.title || ''} onChange={e => updateField('title', e.target.value)}
                    placeholder="Module Title" className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                <input value={module.estimatedTime || ''} onChange={e => updateField('estimatedTime', e.target.value)}
                    placeholder="Est. Time (e.g., 4 hours)" className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                <select value={module.difficulty || 'Intermediate'} onChange={e => updateField('difficulty', e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
            </div>
            <textarea value={module.description || ''} onChange={e => updateField('description', e.target.value)}
                placeholder="Module Description — what the learner will cover and why" rows={2}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none resize-none" />

            {/* Objectives + Concepts */}
            <div className="grid grid-cols-2 gap-4">
                <ArrayField label="Objectives" items={module.objectives || ['']} onChange={v => updateField('objectives', v)} />
                <ArrayField label="Key Concepts" items={module.keyConcepts || ['']} onChange={v => updateField('keyConcepts', v)} />
            </div>

            {/* Practice Problems */}
            <div className="bg-slate-900/50 rounded-lg p-3 border border-blue-500/10">
                <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Practice Problems</label>
                {(module.practiceProblems || []).map((pp, pi) => (
                    <div key={pi} className="flex gap-2 mb-2">
                        <input value={pp.title || ''} onChange={e => { const n = [...(module.practiceProblems || [])]; n[pi] = { ...n[pi], title: e.target.value }; updateField('practiceProblems', n); }}
                            placeholder="Problem name" className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" />
                        {pp.source === 'internal' ? (
                            <select value={pp.url || ''} onChange={e => {
                                const n = [...(module.practiceProblems || [])];
                                const selectedProblem = problems.find(p => `/problems/${p.slug}` === e.target.value);
                                n[pi] = { ...n[pi], url: e.target.value, title: selectedProblem?.title || n[pi].title, difficulty: selectedProblem?.difficulty || n[pi].difficulty };
                                updateField('practiceProblems', n);
                            }}
                                className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none">
                                <option value="">Select Internal Problem</option>
                                {problems.map(p => (
                                    <option key={p._id} value={`/problems/${p.slug}`}>{p.title} ({p.difficulty})</option>
                                ))}
                            </select>
                        ) : (
                            <input value={pp.url || ''} onChange={e => { const n = [...(module.practiceProblems || [])]; n[pi] = { ...n[pi], url: e.target.value }; updateField('practiceProblems', n); }}
                                placeholder="https://leetcode.com/problems/..." className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" />
                        )}
                        <select value={pp.difficulty || 'Medium'} onChange={e => { const n = [...(module.practiceProblems || [])]; n[pi] = { ...n[pi], difficulty: e.target.value }; updateField('practiceProblems', n); }}
                            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none w-24">
                            <option>Easy</option><option>Medium</option><option>Hard</option>
                        </select>
                        <select value={pp.source || 'external'} onChange={e => { const n = [...(module.practiceProblems || [])]; n[pi] = { ...n[pi], source: e.target.value }; updateField('practiceProblems', n); }}
                            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none w-24">
                            <option value="external">External</option>
                            <option value="internal">Internal</option>
                        </select>
                        <button onClick={() => { const n = (module.practiceProblems || []).filter((_, j) => j !== pi); updateField('practiceProblems', n); }}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded"><X className="w-3 h-3" /></button>
                    </div>
                ))}
                <button onClick={() => updateField('practiceProblems', [...(module.practiceProblems || []), { title: '', url: '', difficulty: 'Medium', source: 'external' }])}
                    className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">+ Add Problem</button>
            </div>

            {/* Learning Resources */}
            <div className="bg-slate-900/50 rounded-lg p-3 border border-emerald-500/10">
                <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Learning Resources</label>
                {(module.learningResources || []).map((lr, li) => (
                    <div key={li} className="flex gap-2 mb-2">
                        <input value={lr.title || ''} onChange={e => { const n = [...(module.learningResources || [])]; n[li] = { ...n[li], title: e.target.value }; updateField('learningResources', n); }}
                            placeholder="Resource title" className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" />
                        {lr.source === 'internal' ? (
                            <select value={lr.url || ''} onChange={e => {
                                const n = [...(module.learningResources || [])];
                                const selectedKnowledge = knowledge.find(k => `/knowledge/${k.slug}` === e.target.value);
                                n[li] = { ...n[li], url: e.target.value, title: selectedKnowledge?.topic || n[li].title, type: 'doc' };
                                updateField('learningResources', n);
                            }}
                                className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none">
                                <option value="">Select Knowledge Doc</option>
                                {knowledge.map(k => (
                                    <option key={k._id} value={`/knowledge/${k.slug}`}>{k.topic} ({k.category})</option>
                                ))}
                            </select>
                        ) : (
                            <input value={lr.url || ''} onChange={e => { const n = [...(module.learningResources || [])]; n[li] = { ...n[li], url: e.target.value }; updateField('learningResources', n); }}
                                placeholder="https://docs.example.com/..." className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" />
                        )}
                        <select value={lr.type || 'doc'} onChange={e => { const n = [...(module.learningResources || [])]; n[li] = { ...n[li], type: e.target.value }; updateField('learningResources', n); }}
                            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none w-24">
                            <option value="doc">Doc</option><option value="article">Article</option><option value="video">Video</option><option value="course">Course</option>
                        </select>
                        <select value={lr.source || 'external'} onChange={e => { const n = [...(module.learningResources || [])]; n[li] = { ...n[li], source: e.target.value }; updateField('learningResources', n); }}
                            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none w-24">
                            <option value="external">External</option>
                            <option value="internal">Internal</option>
                        </select>
                        <button onClick={() => { const n = (module.learningResources || []).filter((_, j) => j !== li); updateField('learningResources', n); }}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded"><X className="w-3 h-3" /></button>
                    </div>
                ))}
                <button onClick={() => updateField('learningResources', [...(module.learningResources || []), { title: '', url: '', type: 'doc', source: 'external' }])}
                    className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">+ Add Resource</button>
            </div>

            {/* Interview & Effort Signals */}
            <div className="grid grid-cols-4 gap-3">
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Interview Importance</label>
                    <select value={module.interviewImportance || 'Medium'} onChange={e => updateField('interviewImportance', e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                        <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Concept Weight (1-10)</label>
                    <input type="number" min={1} max={10} value={module.conceptWeight || 5} onChange={e => updateField('conceptWeight', parseInt(e.target.value) || 5)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Reading (min)</label>
                    <input type="number" value={module.effortEstimate?.readingMinutes || 30} onChange={e => updateField('effortEstimate', { ...module.effortEstimate, readingMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Practice (min)</label>
                    <input type="number" value={module.effortEstimate?.practiceMinutes || 45} onChange={e => updateField('effortEstimate', { ...module.effortEstimate, practiceMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                </div>
            </div>

            {/* Unlock Criteria */}
            <div className="bg-slate-900/50 rounded-lg p-3 border border-amber-500/10">
                <label className="block text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Unlock Criteria</label>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[9px] text-slate-500 mb-1">Mastery Threshold %</label>
                        <input type="number" min={0} max={100} value={module.unlockCriteria?.masteryThreshold || 0}
                            onChange={e => updateField('unlockCriteria', { ...module.unlockCriteria, masteryThreshold: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-[9px] text-slate-500 mb-1">Quiz Score %</label>
                        <input type="number" min={0} max={100} value={module.unlockCriteria?.quizScore || 0}
                            onChange={e => updateField('unlockCriteria', { ...module.unlockCriteria, quizScore: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-[9px] text-slate-500 mb-1">Problems Solved</label>
                        <input type="number" min={0} value={module.unlockCriteria?.problemsSolved || 0}
                            onChange={e => updateField('unlockCriteria', { ...module.unlockCriteria, problemsSolved: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyPlanner;
