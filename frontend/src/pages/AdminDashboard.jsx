import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, LayoutDashboard, Code2, BookOpen, Map, Trash2, Plus,
    Sparkles, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronRight,
    Search, AlertTriangle, Play, Eye, Save, ArrowLeft, Users, FileText,
    Zap, Database, BarChart3, X, Link2, BookMarked, Edit3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    getAdminStats, getAdminProblems, createProblem, deleteProblem,
    aiGenerateProblem, validateProblem, getAdminKnowledge, createKnowledge,
    aiGenerateKnowledge, deleteKnowledge, getAdminRoadmaps, createAdminRoadmap, updateAdminRoadmap,
    deleteRoadmap, aiGenerateRoadmap, aiGenerateModule
} from '../services/adminService';

const AdminDashboard = () => {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Problems state
    const [problems, setProblems] = useState([]);
    const [showAddProblem, setShowAddProblem] = useState(false);
    const [problemForm, setProblemForm] = useState({
        title: '', problemStatement: '', difficulty: 'Easy', topic: 'arrays + strings',
        constraints: [''], examples: [{ input: '', output: '', explanation: '' }],
        visibleTestCases: [{ input: '', expectedOutput: '' }],
        hiddenTestCases: [{ input: '', expectedOutput: '' }],
        starterCode: { javascript: '', python: '', cpp: '' },
        referenceSolution: { javascript: '', python: '', cpp: '' },
        judgeDriver: { javascript: '', python: '', cpp: '' },
        judgePreDriver: { javascript: '', python: '', cpp: '' },
        inputSchema: {}, outputSchema: {},
        functionSignature: { methodName: '', parameters: [{ name: '', type: '' }], returnType: '' }
    });
    const [aiTopic, setAiTopic] = useState('');
    const [aiDescription, setAiDescription] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiPreview, setAiPreview] = useState(null);
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState(null);

    // Knowledge state
    const [knowledge, setKnowledge] = useState([]);
    const [showAddKnowledge, setShowAddKnowledge] = useState(false);
    const [knowledgeForm, setKnowledgeForm] = useState({
        topic: '', category: 'DSA', summary: '', detailedContent: '',
        topicType: 'Concept', difficulty: 'Intermediate', tags: '',
        intuition: '',
        keyPrinciples: [''], commonPitfalls: [''],
        complexity: { time: '', space: '' },
        implementations: [{ language: 'JavaScript', code: '', explanation: '' }],
        furtherReading: [{ title: '', url: '', source: 'external', knowledgeRef: null }]
    });
    const [aiKnowledgeTopic, setAiKnowledgeTopic] = useState('');
    const [aiKnowledgeCategory, setAiKnowledgeCategory] = useState('DSA');
    const [aiKnowledgeGenerating, setAiKnowledgeGenerating] = useState(false);

    // Roadmaps state
    const [roadmaps, setRoadmaps] = useState([]);
    const [showAddRoadmap, setShowAddRoadmap] = useState(false);
    const [aiRoadmapTopic, setAiRoadmapTopic] = useState('');
    const [aiRoadmapDifficulty, setAiRoadmapDifficulty] = useState('Intermediate');
    const [aiRoadmapRole, setAiRoadmapRole] = useState('');
    const [aiRoadmapGenerating, setAiRoadmapGenerating] = useState(false);
    const [isEditingRoadmap, setIsEditingRoadmap] = useState(false);
    const [editingRoadmapId, setEditingRoadmapId] = useState(null);
    const [isModuleGenerating, setIsModuleGenerating] = useState(false);

    const defaultModule = {
        title: '', description: '', estimatedTime: '', difficulty: 'Intermediate',
        objectives: [''], keyConcepts: [''], resources: [],
        practiceProblems: [{ title: '', url: '', difficulty: 'Medium', source: 'external' }],
        learningResources: [{ title: '', url: '', type: 'doc', source: 'external' }],
        quizConfig: { autoGenerate: true, topic: '', questionCount: 5 },
        effortEstimate: { readingMinutes: 30, practiceMinutes: 45, assessmentMinutes: 15 },
        interviewImportance: 'Medium', conceptWeight: 5,
        unlockCriteria: { masteryThreshold: 0, quizScore: 0, problemsSolved: 0 },
    };
    const [roadmapForm, setRoadmapForm] = useState({
        title: '', topic: '', description: '', difficulty: 'Intermediate', totalDuration: '',
        learningGoals: [''], targetRoles: [''], expectedOutcomes: [''],
        skillsCovered: [''], tags: '', prerequisites: [''],
        modules: [{ ...defaultModule }]
    });

    const [searchTerm, setSearchTerm] = useState('');

    const topics = ['arrays + strings', 'hashmap / hashing', 'linked list', 'stack + queue', 'trees + heap', 'graph', 'dynamic programming'];
    const categories = ['DSA', 'Web Development', 'AI/ML', 'System Design', 'General', 'OS', 'Networking', 'Database', 'DBMS', 'Distributed Systems', 'Compiler Design', 'Languages', 'Security', 'Big Data', 'Cloud', 'DevOps', 'Emerging Tech', 'Embedded', 'Low Level'];

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => {
        if (activeSection === 'problems') fetchProblems();
        if (activeSection === 'knowledge') fetchKnowledge();
        if (activeSection === 'roadmaps') {
            fetchRoadmaps();
            fetchProblems();
            fetchKnowledge();
        }
    }, [activeSection]);

    const fetchStats = async () => {
        try { const data = await getAdminStats(); setStats(data); }
        catch { toast.error('Failed to load stats'); }
        finally { setLoading(false); }
    };
    const fetchProblems = async () => {
        try { setProblems(await getAdminProblems()); }
        catch { toast.error('Failed to load problems'); }
    };
    const fetchKnowledge = async () => {
        try { setKnowledge(await getAdminKnowledge()); }
        catch { toast.error('Failed to load knowledge'); }
    };
    const fetchRoadmaps = async () => {
        try { setRoadmaps(await getAdminRoadmaps()); }
        catch { toast.error('Failed to load roadmaps'); }
    };

    // === PROBLEM HANDLERS ===
    const handleDeleteProblem = async (id, title) => {
        if (!window.confirm(`Delete "${title}"? This also removes all submissions.`)) return;
        try { await deleteProblem(id); toast.success('Problem deleted'); fetchProblems(); }
        catch { toast.error('Failed to delete'); }
    };

    const handleCreateProblem = async () => {
        const tid = toast.loading('Creating problem...');
        try {
            const cleaned = { ...problemForm };
            cleaned.constraints = cleaned.constraints.filter(c => c.trim());
            cleaned.examples = cleaned.examples.filter(e => e.input.trim() || e.output.trim());
            cleaned.visibleTestCases = cleaned.visibleTestCases.filter(tc => tc.input.trim());
            cleaned.hiddenTestCases = cleaned.hiddenTestCases.filter(tc => tc.input.trim());

            // Clean function signature if empty
            if (cleaned.functionSignature) {
                cleaned.functionSignature.parameters = cleaned.functionSignature.parameters.filter(p => p.name.trim() || p.type.trim());
            }

            // Default schemas if missing
            if (!cleaned.inputSchema || Object.keys(cleaned.inputSchema).length === 0) cleaned.inputSchema = {};
            if (!cleaned.outputSchema || Object.keys(cleaned.outputSchema).length === 0) cleaned.outputSchema = {};

            await createProblem(cleaned);
            toast.success('Problem created!', { id: tid });
            setShowAddProblem(false);
            setProblemForm({
                title: '', problemStatement: '', difficulty: 'Easy', topic: 'arrays + strings',
                constraints: [''], examples: [{ input: '', output: '', explanation: '' }],
                visibleTestCases: [{ input: '', expectedOutput: '' }],
                hiddenTestCases: [{ input: '', expectedOutput: '' }],
                starterCode: { javascript: '', python: '', cpp: '' },
                referenceSolution: { javascript: '', python: '', cpp: '' },
                judgeDriver: { javascript: '', python: '', cpp: '' },
                judgePreDriver: { javascript: '', python: '', cpp: '' },
                inputSchema: {}, outputSchema: {},
                functionSignature: { methodName: '', parameters: [{ name: '', type: '' }], returnType: '' }
            });
            fetchProblems();
        } catch (err) { toast.error(err.response?.data?.message || 'Creation failed', { id: tid }); }
    };

    const handleAIGenerate = async () => {
        if (!aiTopic.trim()) return toast.error('Enter a topic');
        setAiGenerating(true); setValidationResult(null);
        try {
            const res = await aiGenerateProblem(aiTopic, aiDescription);
            const d = res.preview;

            setProblemForm({
                title: d.title || aiTopic,
                problemStatement: d.problemStatement || '',
                difficulty: d.difficulty || 'Medium',
                topic: aiTopic.toLowerCase().includes('hash') ? 'hashmap / hashing' :
                    aiTopic.toLowerCase().includes('tree') ? 'trees + heap' : 'arrays + strings',
                constraints: d.constraints?.length ? d.constraints : [''],
                examples: d.examples?.length ? d.examples : [{ input: '', output: '', explanation: '' }],
                visibleTestCases: d.visibleTestCases?.length ? d.visibleTestCases : [{ input: '', expectedOutput: '' }],
                hiddenTestCases: d.hiddenTestCases?.length ? d.hiddenTestCases : [{ input: '', expectedOutput: '' }],
                starterCode: d.starterCode || { javascript: '', python: '', cpp: '' },
                referenceSolution: d.referenceSolution || { javascript: '', python: '', cpp: '' },
                judgeDriver: d.judgeDriver || { javascript: '', python: '', cpp: '' },
                judgePreDriver: d.judgePreDriver || { javascript: '', python: '', cpp: '' },
                inputSchema: d.inputSchema || {},
                outputSchema: d.outputSchema || {},
                functionSignature: d.functionSignature || { methodName: '', parameters: [], returnType: '' }
            });

            setAiPreview(d); // Keep for validation
            setShowAddProblem(true);
            toast.success('Generated! Review and edit in the form below.');
        } catch (err) {
            toast.error('AI generation failed');
            console.error(err);
        } finally { setAiGenerating(false); }
    };

    const handleValidateAI = async () => {
        if (!aiPreview) return;
        setValidating(true);
        try {
            const res = await validateProblem(aiPreview);
            setValidationResult(res);
            if (res.validated) toast.success('All tests passed! Ready to commit.');
            else toast.error('Some tests failed. Review results.');
        } catch { toast.error('Validation failed'); }
        finally { setValidating(false); }
    };

    const handleCommitAI = async () => {
        if (!aiPreview) return;
        const tid = toast.loading('Committing to database...');
        try {
            await createProblem({ ...aiPreview, validated: true });
            toast.success('Problem committed!', { id: tid });
            setAiPreview(null); setValidationResult(null); setAiTopic('');
            fetchProblems();
        } catch (err) { toast.error(err.response?.data?.message || 'Commit failed', { id: tid }); }
    };

    // === KNOWLEDGE HANDLERS ===
    const handleDeleteKnowledge = async (id, topic) => {
        if (!window.confirm(`Delete knowledge entry "${topic}"?`)) return;
        try { await deleteKnowledge(id); toast.success('Entry deleted'); fetchKnowledge(); }
        catch { toast.error('Failed to delete'); }
    };

    const handleCreateKnowledge = async () => {
        const tid = toast.loading('Creating knowledge entry...');
        try {
            const cleaned = { ...knowledgeForm };
            cleaned.keyPrinciples = cleaned.keyPrinciples.filter(k => k.trim());
            cleaned.commonPitfalls = cleaned.commonPitfalls.filter(p => p.trim());
            cleaned.implementations = cleaned.implementations.filter(im => im.code.trim());
            cleaned.furtherReading = cleaned.furtherReading
                .filter(fr => fr.source === 'internal' ? fr.knowledgeRef : (fr.title.trim() && fr.url.trim()))
                .map(fr => {
                    if (fr.source === 'internal' && fr.knowledgeRef) {
                        const entry = knowledge.find(k => k._id === fr.knowledgeRef);
                        return {
                            title: entry?.topic || fr.title,
                            url: `/knowledge/${entry?.slug || fr.knowledgeRef}`,
                            source: 'internal',
                            knowledgeRef: fr.knowledgeRef
                        };
                    }
                    return { title: fr.title, url: fr.url, source: 'external' };
                });
            cleaned.tags = typeof cleaned.tags === 'string'
                ? cleaned.tags.split(',').map(t => t.trim()).filter(Boolean)
                : cleaned.tags;
            await createKnowledge(cleaned);
            toast.success('Knowledge entry created!', { id: tid });
            setShowAddKnowledge(false);
            setKnowledgeForm({
                topic: '', category: 'DSA', summary: '', detailedContent: '',
                topicType: 'Concept', difficulty: 'Intermediate', tags: '',
                intuition: '',
                keyPrinciples: [''], commonPitfalls: [''],
                complexity: { time: '', space: '' },
                implementations: [{ language: 'JavaScript', code: '', explanation: '' }],
                furtherReading: [{ title: '', url: '', source: 'external', knowledgeRef: null }]
            });
            fetchKnowledge();
        } catch (err) { toast.error(err.response?.data?.message || 'Creation failed', { id: tid }); }
    };

    const handleAIKnowledge = async () => {
        if (!aiKnowledgeTopic.trim()) return toast.error('Enter a topic');
        setAiKnowledgeGenerating(true);
        try {
            const res = await aiGenerateKnowledge(aiKnowledgeTopic, aiKnowledgeCategory);
            const d = res.preview;
            setKnowledgeForm({
                topic: d.topic || aiKnowledgeTopic,
                category: d.category || aiKnowledgeCategory,
                summary: d.summary || '',
                detailedContent: d.detailedContent || '',
                topicType: d.topicType || 'Concept',
                difficulty: d.difficulty || 'Intermediate',
                tags: Array.isArray(d.tags) ? d.tags.join(', ') : (d.tags || ''),
                intuition: d.intuition || '',
                keyPrinciples: d.keyPrinciples?.length ? d.keyPrinciples : [''],
                commonPitfalls: d.commonPitfalls?.length ? d.commonPitfalls : [''],
                complexity: d.complexity || { time: '', space: '' },
                implementations: (d.implementations || d.codeSnippets || []).length
                    ? (d.implementations || d.codeSnippets).map(im => ({
                        language: im.language || 'JavaScript',
                        code: im.code || '',
                        explanation: im.explanation || ''
                    }))
                    : [{ language: 'JavaScript', code: '', explanation: '' }],
                furtherReading: (d.furtherReading || d.verifiedResources || []).length
                    ? (d.furtherReading || d.verifiedResources).map(fr => ({
                        title: fr.title || '',
                        url: fr.url || '',
                        source: fr.source || 'external',
                        knowledgeRef: fr.knowledgeRef || null
                    }))
                    : [{ title: '', url: '', source: 'external', knowledgeRef: null }]
            });
            setShowAddKnowledge(true);
            toast.success('AI content generated! Review and save.');
        } catch { toast.error('AI generation failed'); }
        finally { setAiKnowledgeGenerating(false); }
    };

    // === ROADMAP HANDLERS ===
    const handleDeleteRoadmap = async (id, title) => {
        if (!window.confirm(`Delete roadmap "${title}"?`)) return;
        try { await deleteRoadmap(id); toast.success('Roadmap deleted'); fetchRoadmaps(); }
        catch { toast.error('Failed to delete'); }
    };

    const handleCreateRoadmap = async () => {
        const tid = toast.loading(isEditingRoadmap ? 'Updating roadmap...' : 'Creating roadmap...');
        try {
            const cleaned = { ...roadmapForm };
            cleaned.tags = typeof cleaned.tags === 'string' ? cleaned.tags.split(',').map(t => t.trim()).filter(Boolean) : cleaned.tags;
            cleaned.learningGoals = (cleaned.learningGoals || []).filter(g => g.trim());
            cleaned.targetRoles = (cleaned.targetRoles || []).filter(r => r.trim());
            cleaned.expectedOutcomes = (cleaned.expectedOutcomes || []).filter(o => o.trim());
            cleaned.skillsCovered = (cleaned.skillsCovered || []).filter(s => s.trim());
            cleaned.prerequisites = (cleaned.prerequisites || []).filter(p => p.trim());
            cleaned.modules = cleaned.modules.map(m => ({
                ...m,
                objectives: (m.objectives || []).filter(o => o.trim()),
                keyConcepts: (m.keyConcepts || []).filter(k => k.trim()),
                practiceProblems: (m.practiceProblems || []).filter(p => p.title?.trim() || p.url?.trim()),
                learningResources: (m.learningResources || []).filter(r => r.title?.trim() || r.url?.trim()),
            }));
            if (isEditingRoadmap) {
                await updateAdminRoadmap(editingRoadmapId, cleaned);
                toast.success('Roadmap updated!', { id: tid });
            } else {
                await createAdminRoadmap(cleaned);
                toast.success('Roadmap created!', { id: tid });
            }
            setShowAddRoadmap(false);
            setIsEditingRoadmap(false);
            setEditingRoadmapId(null);
            setRoadmapForm({
                title: '', topic: '', description: '', difficulty: 'Intermediate', totalDuration: '',
                learningGoals: [''], targetRoles: [''], expectedOutcomes: [''],
                skillsCovered: [''], tags: '', prerequisites: [''],
                modules: [{ ...defaultModule }]
            });
            fetchRoadmaps();
        } catch (err) { toast.error(err.response?.data?.message || 'Action failed', { id: tid }); }
    };

    const handleEditRoadmap = (r) => {
        setIsEditingRoadmap(true);
        setEditingRoadmapId(r._id);
        setRoadmapForm({
            title: r.title,
            topic: r.topic,
            description: r.description,
            difficulty: r.difficulty,
            totalDuration: r.totalDuration,
            learningGoals: r.learningGoals?.length ? r.learningGoals : [''],
            targetRoles: r.targetRoles?.length ? r.targetRoles : [''],
            expectedOutcomes: r.expectedOutcomes?.length ? r.expectedOutcomes : [''],
            skillsCovered: r.skillsCovered?.length ? r.skillsCovered : [''],
            tags: Array.isArray(r.tags) ? r.tags.join(', ') : (r.tags || ''),
            prerequisites: r.prerequisites?.length ? r.prerequisites : [''],
            modules: r.modules.map(m => ({
                ...m,
                objectives: m.objectives?.length ? m.objectives : [''],
                keyConcepts: m.keyConcepts?.length ? m.keyConcepts : [''],
                practiceProblems: m.practiceProblems?.length ? m.practiceProblems : [{ title: '', url: '', difficulty: 'Medium', source: 'external' }],
                learningResources: m.learningResources?.length ? m.learningResources : [{ title: '', url: '', type: 'doc', source: 'external' }],
            }))
        });
        setShowAddRoadmap(true);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddAIModule = async (topicSuggestion = '') => {
        const topic = prompt("Enter topic for new module:", topicSuggestion || aiRoadmapTopic);
        if (!topic) return;

        setIsModuleGenerating(true);
        try {
            const res = await aiGenerateModule(topic, roadmapForm.difficulty, roadmapForm.modules.length);
            setRoadmapForm({
                ...roadmapForm,
                modules: [...roadmapForm.modules, res.preview]
            });
            toast.success('AI Module added!');
        } catch (err) {
            toast.error('Failed to generate module');
        } finally {
            setIsModuleGenerating(false);
        }
    };

    const handleAIRoadmap = async () => {
        if (!aiRoadmapTopic.trim()) return toast.error('Enter a topic');
        setAiRoadmapGenerating(true);
        try {
            const res = await aiGenerateRoadmap(aiRoadmapTopic, aiRoadmapDifficulty, aiRoadmapRole);
            const d = res.preview;
            setIsEditingRoadmap(false);
            setEditingRoadmapId(null);
            setRoadmapForm({
                title: d.title || `Mastering ${aiRoadmapTopic}`,
                topic: d.topic || aiRoadmapTopic,
                description: d.description || '',
                difficulty: d.difficulty || aiRoadmapDifficulty,
                totalDuration: d.totalDuration || '',
                learningGoals: d.learningGoals?.length ? d.learningGoals : [''],
                targetRoles: d.targetRoles?.length ? d.targetRoles : [''],
                expectedOutcomes: d.expectedOutcomes?.length ? d.expectedOutcomes : [''],
                skillsCovered: d.skillsCovered?.length ? d.skillsCovered : [''],
                tags: Array.isArray(d.tags) ? d.tags.join(', ') : (d.tags || ''),
                prerequisites: d.prerequisites?.length ? d.prerequisites : [''],
                modules: (d.modules || []).length ? d.modules.map((m, i) => ({
                    title: m.title || '',
                    description: m.description || '',
                    estimatedTime: m.estimatedTime || '',
                    difficulty: m.difficulty || 'Intermediate',
                    objectives: m.objectives?.length ? m.objectives : [''],
                    keyConcepts: m.keyConcepts?.length ? m.keyConcepts : [''],
                    resources: m.resources || [],
                    practiceProblems: m.practiceProblems?.length ? m.practiceProblems : [{ title: '', url: '', difficulty: 'Medium', source: 'external' }],
                    learningResources: m.learningResources?.length ? m.learningResources.map(r => ({ ...r, source: r.source || 'external' })) : [{ title: '', url: '', type: 'doc', source: 'external' }],
                    quizConfig: m.quizConfig || { autoGenerate: true, topic: m.title || '', questionCount: 5 },
                    effortEstimate: m.effortEstimate || { readingMinutes: 30, practiceMinutes: 45, assessmentMinutes: 15 },
                    interviewImportance: m.interviewImportance || 'Medium',
                    conceptWeight: m.conceptWeight || 5,
                    unlockCriteria: m.unlockCriteria || { masteryThreshold: 0, quizScore: 0, problemsSolved: 0 },
                })) : [{ ...defaultModule }]
            });
            setShowAddRoadmap(true);
            toast.success('AI roadmap generated! Review and publish.');
        } catch { toast.error('AI roadmap generation failed'); }
        finally { setAiRoadmapGenerating(false); }
    };

    // === UTILITY COMPONENTS ===
    const ArrayField = ({ label, values, onChange }) => (
        <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</label>
            {values.map((v, i) => (
                <div key={i} className="flex gap-2 mb-2">
                    <input value={v} onChange={e => { const n = [...values]; n[i] = e.target.value; onChange(n); }}
                        className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50" />
                    <button onClick={() => onChange(values.filter((_, j) => j !== i))}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><X className="w-3 h-3" /></button>
                </div>
            ))}
            <button onClick={() => onChange([...values, ''])}
                className="text-[10px] text-primary-400 font-bold uppercase tracking-widest hover:text-white transition-colors">+ Add</button>
        </div>
    );

    const TextArea = ({ label, value, onChange, rows = 4, placeholder }) => (
        <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</label>
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-primary-500/50 resize-none" />
        </div>
    );

    const InputField = ({ label, value, onChange, placeholder }) => (
        <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</label>
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50" />
        </div>
    );

    const sidebarItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'problems', label: 'Problems', icon: Code2 },
        { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
        { id: 'roadmaps', label: 'Roadmaps', icon: Map },
    ];

    const StatCard = ({ icon: Icon, label, value, color }) => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:border-${color}-500/30 transition-all group`}>
            <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-4 border border-${color}-500/20`}>
                <Icon className={`w-5 h-5 text-${color}-500`} />
            </div>
            <p className="text-3xl font-black text-white mb-1">{value ?? '—'}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-slate-950 flex flex-col flex-shrink-0 sticky top-0 h-screen">
                <div className="p-6 border-b border-white/5">
                    <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4">
                        <ArrowLeft className="w-3 h-3" /> Back to App
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white">Admin Panel</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Content Control</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {sidebarItems.map(item => (
                        <button key={item.id} onClick={() => setActiveSection(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeSection === item.id
                                ? 'bg-primary-600/10 text-primary-400 border border-primary-500/20 shadow-lg shadow-primary-500/5'
                                : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-8 py-10 space-y-8">
                    <AnimatePresence mode="wait">
                        {/* ======= DASHBOARD ======= */}
                        {activeSection === 'dashboard' && (
                            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                                <div>
                                    <h1 className="text-4xl font-black text-white mb-2">Admin Dashboard</h1>
                                    <p className="text-slate-500 text-sm">Platform overview and content management.</p>
                                </div>
                                {loading ? (
                                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="blue" />
                                        <StatCard icon={Code2} label="Problems" value={stats?.totalProblems} color="emerald" />
                                        <StatCard icon={Zap} label="Submissions" value={stats?.totalSubmissions} color="amber" />
                                        <StatCard icon={BookOpen} label="Knowledge" value={stats?.totalKnowledge} color="purple" />
                                        <StatCard icon={Map} label="Roadmaps" value={stats?.totalRoadmaps} color="rose" />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ======= PROBLEMS ======= */}
                        {activeSection === 'problems' && (
                            <motion.div key="problems" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-3xl font-black text-white mb-1">Problem Management</h1>
                                        <p className="text-slate-500 text-sm">{problems.length} problems in curriculum</p>
                                    </div>
                                    <button onClick={() => setShowAddProblem(!showAddProblem)}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20">
                                        <Plus className="w-4 h-4" /> Add Problem
                                    </button>
                                </div>

                                {/* AI Generation Section */}
                                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-sm font-black text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> AI Problem Generator</h3>
                                    <div className="space-y-3">
                                        <div className="flex gap-3">
                                            <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="Topic (e.g., LFU Cache, Binary Search...)"
                                                className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500/50" />
                                            <button onClick={handleAIGenerate} disabled={aiGenerating}
                                                className="px-6 py-2.5 bg-amber-600 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-500 disabled:opacity-50 transition-all">
                                                {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                {aiGenerating ? 'Generating...' : 'Generate'}
                                            </button>
                                        </div>
                                        <textarea
                                            value={aiDescription}
                                            onChange={e => setAiDescription(e.target.value)}
                                            placeholder="Specific Constraints or Description (Optional)... e.g., Must use O(1) time complexity, include tie-breaker logic."
                                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50 min-h-[80px]"
                                        />
                                    </div>

                                    {/* AI Preview */}
                                    {aiPreview && (
                                        <div className="mt-4 space-y-4 border-t border-white/5 pt-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-white font-bold">{aiPreview.title}
                                                    <span className={`ml-3 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${aiPreview.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : aiPreview.difficulty === 'Medium' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 'text-rose-400 bg-rose-400/10 border-rose-400/20'}`}>{aiPreview.difficulty}</span>
                                                </h4>
                                                <div className="flex gap-2">
                                                    <button onClick={handleValidateAI} disabled={validating}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 disabled:opacity-50">
                                                        {validating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                                        {validating ? 'Testing...' : 'Run Tests'}
                                                    </button>
                                                    {validationResult?.validated && (
                                                        <button onClick={handleCommitAI}
                                                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500">
                                                            <Save className="w-3 h-3" /> Commit to DB
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-slate-400 text-sm">{aiPreview.problemStatement?.substring(0, 200)}...</p>
                                            <div className="text-[10px] text-slate-500">
                                                {aiPreview.visibleTestCases?.length || 0} visible + {aiPreview.hiddenTestCases?.length || 0} hidden test cases
                                            </div>

                                            {/* Validation Results */}
                                            {validationResult && (
                                                <div className={`p-4 rounded-xl border ${validationResult.validated ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-rose-950/20 border-rose-500/20'}`}>
                                                    <h5 className={`text-sm font-black mb-3 ${validationResult.validated ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {validationResult.validated ? '✅ All Validations Passed' : '❌ Validation Failed'}
                                                    </h5>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {Object.entries(validationResult.results).map(([lang, r]) => (
                                                            <div key={lang} className="bg-black/30 rounded-lg p-3">
                                                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{lang}</p>
                                                                <p className={`text-sm font-bold ${r.status === 'all_passed' ? 'text-emerald-400' : r.status === 'skipped' ? 'text-slate-500' : 'text-rose-400'}`}>
                                                                    {r.status === 'all_passed' ? `✓ ${r.passed}/${r.total}` : r.status === 'skipped' ? 'Skipped' : `✗ ${r.passed || 0}/${r.total || '?'}`}
                                                                </p>
                                                                {r.stderr && <p className="text-[10px] text-rose-300 mt-1 truncate">{r.stderr}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Manual Add Problem Form */}
                                <AnimatePresence>
                                    {showAddProblem && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-6 overflow-hidden">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-black text-white flex items-center gap-2"><Plus className="w-4 h-4 text-primary-500" /> Manual Problem Creation</h3>
                                                <button onClick={() => setShowAddProblem(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField label="Title" value={problemForm.title} onChange={v => setProblemForm({ ...problemForm, title: v })} placeholder="Two Sum" />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Difficulty</label>
                                                        <select value={problemForm.difficulty} onChange={e => setProblemForm({ ...problemForm, difficulty: e.target.value })}
                                                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                                            <option value="Easy">Easy</option>
                                                            <option value="Medium">Medium</option>
                                                            <option value="Hard">Hard</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Topic</label>
                                                        <select value={problemForm.topic} onChange={e => setProblemForm({ ...problemForm, topic: e.target.value })}
                                                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                                            {topics.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <TextArea label="Problem Statement (Markdown)" value={problemForm.problemStatement}
                                                onChange={v => setProblemForm({ ...problemForm, problemStatement: v })} rows={6} placeholder="Given an array of integers..." />

                                            <ArrayField label="Constraints" values={problemForm.constraints}
                                                onChange={v => setProblemForm({ ...problemForm, constraints: v })} />

                                            {/* Test Cases */}
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Visible Test Cases</label>
                                                    {problemForm.visibleTestCases.map((tc, i) => (
                                                        <div key={i} className="bg-black/20 rounded-lg p-3 mb-2 space-y-2">
                                                            <input value={tc.input} onChange={e => { const n = [...problemForm.visibleTestCases]; n[i].input = e.target.value; setProblemForm({ ...problemForm, visibleTestCases: n }); }}
                                                                placeholder="Input" className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none" />
                                                            <input value={tc.expectedOutput} onChange={e => { const n = [...problemForm.visibleTestCases]; n[i].expectedOutput = e.target.value; setProblemForm({ ...problemForm, visibleTestCases: n }); }}
                                                                placeholder="Expected Output" className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none" />
                                                        </div>
                                                    ))}
                                                    <button onClick={() => setProblemForm({ ...problemForm, visibleTestCases: [...problemForm.visibleTestCases, { input: '', expectedOutput: '' }] })}
                                                        className="text-[10px] text-primary-400 font-bold uppercase tracking-widest">+ Add</button>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Hidden Test Cases</label>
                                                    {problemForm.hiddenTestCases.map((tc, i) => (
                                                        <div key={i} className="bg-black/20 rounded-lg p-3 mb-2 space-y-2">
                                                            <input value={tc.input} onChange={e => { const n = [...problemForm.hiddenTestCases]; n[i].input = e.target.value; setProblemForm({ ...problemForm, hiddenTestCases: n }); }}
                                                                placeholder="Input" className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none" />
                                                            <input value={tc.expectedOutput} onChange={e => { const n = [...problemForm.hiddenTestCases]; n[i].expectedOutput = e.target.value; setProblemForm({ ...problemForm, hiddenTestCases: n }); }}
                                                                placeholder="Expected Output" className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none" />
                                                        </div>
                                                    ))}
                                                    <button onClick={() => setProblemForm({ ...problemForm, hiddenTestCases: [...problemForm.hiddenTestCases, { input: '', expectedOutput: '' }] })}
                                                        className="text-[10px] text-primary-400 font-bold uppercase tracking-widest">+ Add</button>
                                                </div>
                                            </div>

                                            {/* Code Sections */}
                                            {['starterCode', 'referenceSolution', 'judgeDriver', 'judgePreDriver'].map(field => (
                                                <div key={field}>
                                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{field.replace(/([A-Z])/g, ' $1')}</h4>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {['javascript', 'python', 'cpp'].map(lang => (
                                                            <TextArea key={lang} label={lang} value={problemForm[field][lang]}
                                                                onChange={v => setProblemForm({ ...problemForm, [field]: { ...problemForm[field], [lang]: v } })}
                                                                rows={4} placeholder={`${lang} code...`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                            <button onClick={handleCreateProblem}
                                                className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20">
                                                <Save className="w-4 h-4" /> Create Problem
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Problem List */}
                                <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead><tr className="border-b border-white/5">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Title</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Difficulty</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Topic</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Acceptance</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-20"></th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-white/5">
                                            {problems.map(p => (
                                                <tr key={p._id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-3 text-sm font-bold text-white">{p.title}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${p.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : p.difficulty === 'Medium' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 'text-rose-400 bg-rose-400/10 border-rose-400/20'}`}>{p.difficulty}</span>
                                                    </td>
                                                    <td className="px-6 py-3 text-xs text-slate-400 capitalize">{p.topic}</td>
                                                    <td className="px-6 py-3 text-xs text-slate-400">{p.acceptanceRate || 0}%</td>
                                                    <td className="px-6 py-3">
                                                        <button onClick={() => handleDeleteProblem(p._id, p.title)}
                                                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {/* ======= KNOWLEDGE BASE ======= */}
                        {activeSection === 'knowledge' && (
                            <motion.div key="knowledge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-3xl font-black text-white mb-1">Knowledge Base</h1>
                                        <p className="text-slate-500 text-sm">{knowledge.length} entries</p>
                                    </div>
                                    <button onClick={() => setShowAddKnowledge(!showAddKnowledge)}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-500 transition-all">
                                        <Plus className="w-4 h-4" /> Add Entry
                                    </button>
                                </div>

                                {/* AI Knowledge Generator */}
                                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-sm font-black text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> AI Knowledge Generator</h3>
                                    <div className="flex gap-3">
                                        <input value={aiKnowledgeTopic} onChange={e => setAiKnowledgeTopic(e.target.value)} placeholder="e.g., Red-Black Trees, TCP/IP..."
                                            className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500/50" />
                                        <select value={aiKnowledgeCategory} onChange={e => setAiKnowledgeCategory(e.target.value)}
                                            className="bg-slate-950 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none">
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <button onClick={handleAIKnowledge} disabled={aiKnowledgeGenerating}
                                            className="px-6 py-2.5 bg-amber-600 text-white rounded-lg text-xs font-black uppercase flex items-center gap-2 hover:bg-amber-500 disabled:opacity-50">
                                            {aiKnowledgeGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            {aiKnowledgeGenerating ? 'Generating...' : 'Generate'}
                                        </button>
                                    </div>
                                </div>

                                {/* Manual Add Knowledge */}
                                <AnimatePresence>
                                    {showAddKnowledge && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-5 overflow-hidden">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-black text-white">Create Knowledge Entry</h3>
                                                <button onClick={() => setShowAddKnowledge(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                                            </div>

                                            {/* Row 1: Topic + Category */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField label="Topic" value={knowledgeForm.topic} onChange={v => setKnowledgeForm({ ...knowledgeForm, topic: v })} placeholder="Hash Tables" />
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Category</label>
                                                    <select value={knowledgeForm.category} onChange={e => setKnowledgeForm({ ...knowledgeForm, category: e.target.value })}
                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                                                </div>
                                            </div>

                                            {/* Row 2: Topic Type + Difficulty + Tags */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Topic Type</label>
                                                    <select value={knowledgeForm.topicType} onChange={e => setKnowledgeForm({ ...knowledgeForm, topicType: e.target.value })}
                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                                        <option value="Concept">Concept</option>
                                                        <option value="Algorithm">Algorithm</option>
                                                        <option value="Theory">Theory</option>
                                                        <option value="Design">Design</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Difficulty</label>
                                                    <select value={knowledgeForm.difficulty} onChange={e => setKnowledgeForm({ ...knowledgeForm, difficulty: e.target.value })}
                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                                        <option value="Beginner">Beginner</option>
                                                        <option value="Intermediate">Intermediate</option>
                                                        <option value="Advanced">Advanced</option>
                                                    </select>
                                                </div>
                                                <InputField label="Tags (comma-separated)" value={knowledgeForm.tags} onChange={v => setKnowledgeForm({ ...knowledgeForm, tags: v })} placeholder="arrays, hashing, lookup" />
                                            </div>

                                            {/* Summary + Intuition */}
                                            <InputField label="Summary" value={knowledgeForm.summary} onChange={v => setKnowledgeForm({ ...knowledgeForm, summary: v })} placeholder="A concise summary..." />
                                            <TextArea label="Intuition (ELI5 / Analogy)" value={knowledgeForm.intuition} onChange={v => setKnowledgeForm({ ...knowledgeForm, intuition: v })} rows={3} placeholder="Think of it like a dictionary where you look up words instantly..." />
                                            <TextArea label="Detailed Content (Markdown)" value={knowledgeForm.detailedContent} onChange={v => setKnowledgeForm({ ...knowledgeForm, detailedContent: v })} rows={8} placeholder="## Overview\nFull content in markdown..." />

                                            {/* Key Principles + Common Pitfalls */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <ArrayField label="Key Principles" values={knowledgeForm.keyPrinciples} onChange={v => setKnowledgeForm({ ...knowledgeForm, keyPrinciples: v })} />
                                                <ArrayField label="Common Pitfalls" values={knowledgeForm.commonPitfalls} onChange={v => setKnowledgeForm({ ...knowledgeForm, commonPitfalls: v })} />
                                            </div>

                                            {/* Complexity */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField label="Time Complexity" value={knowledgeForm.complexity.time} onChange={v => setKnowledgeForm({ ...knowledgeForm, complexity: { ...knowledgeForm.complexity, time: v } })} placeholder="O(n)" />
                                                <InputField label="Space Complexity" value={knowledgeForm.complexity.space} onChange={v => setKnowledgeForm({ ...knowledgeForm, complexity: { ...knowledgeForm.complexity, space: v } })} placeholder="O(1)" />
                                            </div>

                                            {/* Implementation Examples */}
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Implementation Examples</label>
                                                {knowledgeForm.implementations.map((impl, i) => (
                                                    <div key={i} className="bg-black/20 rounded-xl p-4 mb-3 space-y-3 border border-white/5">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <select value={impl.language} onChange={e => { const n = [...knowledgeForm.implementations]; n[i].language = e.target.value; setKnowledgeForm({ ...knowledgeForm, implementations: n }); }}
                                                                    className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none">
                                                                    <option>JavaScript</option><option>Python</option><option>C++</option><option>Java</option><option>Go</option><option>SQL</option><option>Bash</option>
                                                                </select>
                                                                <span className="text-[10px] font-black text-slate-600 uppercase">Example {i + 1}</span>
                                                            </div>
                                                            {knowledgeForm.implementations.length > 1 && (
                                                                <button onClick={() => setKnowledgeForm({ ...knowledgeForm, implementations: knowledgeForm.implementations.filter((_, j) => j !== i) })}
                                                                    className="text-rose-500 text-[10px] hover:text-rose-400">Remove</button>
                                                            )}
                                                        </div>
                                                        <textarea value={impl.code} onChange={e => { const n = [...knowledgeForm.implementations]; n[i].code = e.target.value; setKnowledgeForm({ ...knowledgeForm, implementations: n }); }}
                                                            placeholder={`// ${impl.language} code here...`} rows={5}
                                                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-primary-500/50 resize-none" />
                                                        <input value={impl.explanation} onChange={e => { const n = [...knowledgeForm.implementations]; n[i].explanation = e.target.value; setKnowledgeForm({ ...knowledgeForm, implementations: n }); }}
                                                            placeholder="Explanation of this code snippet..."
                                                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500/50" />
                                                    </div>
                                                ))}
                                                <button onClick={() => setKnowledgeForm({ ...knowledgeForm, implementations: [...knowledgeForm.implementations, { language: 'Python', code: '', explanation: '' }] })}
                                                    className="text-[10px] text-primary-400 font-bold uppercase tracking-widest hover:text-white transition-colors">+ Add Implementation</button>
                                            </div>

                                            {/* Further Reading */}
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Further Reading</label>
                                                {knowledgeForm.furtherReading.map((fr, i) => (
                                                    <div key={i} className="bg-black/20 rounded-xl p-4 mb-3 space-y-3 border border-white/5">
                                                        {/* Source Toggle */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-white/10">
                                                                <button
                                                                    onClick={() => { const n = [...knowledgeForm.furtherReading]; n[i] = { ...n[i], source: 'internal', url: '', title: '' }; setKnowledgeForm({ ...knowledgeForm, furtherReading: n }); }}
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${fr.source === 'internal'
                                                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm'
                                                                        : 'text-slate-500 hover:text-slate-300'
                                                                        }`}>
                                                                    <BookMarked className="w-3 h-3" /> Internal
                                                                </button>
                                                                <button
                                                                    onClick={() => { const n = [...knowledgeForm.furtherReading]; n[i] = { ...n[i], source: 'external', knowledgeRef: null }; setKnowledgeForm({ ...knowledgeForm, furtherReading: n }); }}
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${fr.source === 'external'
                                                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm'
                                                                        : 'text-slate-500 hover:text-slate-300'
                                                                        }`}>
                                                                    <Link2 className="w-3 h-3" /> External
                                                                </button>
                                                            </div>
                                                            <button onClick={() => setKnowledgeForm({ ...knowledgeForm, furtherReading: knowledgeForm.furtherReading.filter((_, j) => j !== i) })}
                                                                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"><X className="w-3 h-3" /></button>
                                                        </div>

                                                        {/* Internal: Knowledge Picker */}
                                                        {fr.source === 'internal' ? (
                                                            <div className="relative">
                                                                <div className="flex items-center gap-2">
                                                                    <BookMarked className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                                                    <select
                                                                        value={fr.knowledgeRef || ''}
                                                                        onChange={e => {
                                                                            const n = [...knowledgeForm.furtherReading];
                                                                            const selected = knowledge.find(k => k._id === e.target.value);
                                                                            n[i] = { ...n[i], knowledgeRef: e.target.value, title: selected?.topic || '' };
                                                                            setKnowledgeForm({ ...knowledgeForm, furtherReading: n });
                                                                        }}
                                                                        className="flex-1 bg-slate-900 border border-purple-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer">
                                                                        <option value="">— Select from Knowledge Base —</option>
                                                                        {knowledge
                                                                            .filter(k => k.topic !== knowledgeForm.topic)
                                                                            .sort((a, b) => a.topic.localeCompare(b.topic))
                                                                            .map(k => (
                                                                                <option key={k._id} value={k._id}>
                                                                                    {k.topic} ({k.category})
                                                                                </option>
                                                                            ))
                                                                        }
                                                                    </select>
                                                                    <ChevronDown className="w-4 h-4 text-slate-500 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                                                                </div>
                                                                {fr.knowledgeRef && (
                                                                    <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                                                        <CheckCircle2 className="w-3 h-3 text-purple-400" />
                                                                        <span className="text-[10px] text-purple-300 font-bold">Linked: {knowledge.find(k => k._id === fr.knowledgeRef)?.topic}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            /* External: Title + URL */
                                                            <div className="flex gap-3">
                                                                <div className="flex-1">
                                                                    <input value={fr.title} onChange={e => { const n = [...knowledgeForm.furtherReading]; n[i].title = e.target.value; setKnowledgeForm({ ...knowledgeForm, furtherReading: n }); }}
                                                                        placeholder="Resource Title (e.g., MDN Web Docs)"
                                                                        className="w-full bg-slate-900 border border-blue-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <input value={fr.url} onChange={e => { const n = [...knowledgeForm.furtherReading]; n[i].url = e.target.value; setKnowledgeForm({ ...knowledgeForm, furtherReading: n }); }}
                                                                        placeholder="https://developer.mozilla.org/..."
                                                                        className="w-full bg-slate-900 border border-blue-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                <div className="flex gap-3 mt-2">
                                                    <button onClick={() => setKnowledgeForm({ ...knowledgeForm, furtherReading: [...knowledgeForm.furtherReading, { title: '', url: '', source: 'internal', knowledgeRef: null }] })}
                                                        className="text-[10px] text-purple-400 font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
                                                        <BookMarked className="w-3 h-3" /> + Internal Link
                                                    </button>
                                                    <span className="text-slate-700">|</span>
                                                    <button onClick={() => setKnowledgeForm({ ...knowledgeForm, furtherReading: [...knowledgeForm.furtherReading, { title: '', url: '', source: 'external', knowledgeRef: null }] })}
                                                        className="text-[10px] text-blue-400 font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
                                                        <Link2 className="w-3 h-3" /> + External Link
                                                    </button>
                                                </div>
                                            </div>

                                            <button onClick={handleCreateKnowledge}
                                                className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20">
                                                <Save className="w-4 h-4" /> Save Knowledge Entry
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Knowledge List */}
                                <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead><tr className="border-b border-white/5">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Topic</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Summary</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-20"></th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-white/5">
                                            {knowledge.map(k => (
                                                <tr key={k._id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-3 text-sm font-bold text-white">{k.topic}</td>
                                                    <td className="px-6 py-3"><span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">{k.category}</span></td>
                                                    <td className="px-6 py-3 text-xs text-slate-400 max-w-xs truncate">{k.summary}</td>
                                                    <td className="px-6 py-3"><button onClick={() => handleDeleteKnowledge(k._id, k.topic)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {/* ======= ROADMAPS ======= */}
                        {activeSection === 'roadmaps' && (
                            <motion.div key="roadmaps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-3xl font-black text-white mb-1">Community Roadmaps</h1>
                                        <p className="text-slate-500 text-sm">{roadmaps.length} public roadmaps</p>
                                    </div>
                                    <button onClick={() => setShowAddRoadmap(!showAddRoadmap)}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-500 transition-all">
                                        <Plus className="w-4 h-4" /> Create Roadmap
                                    </button>
                                </div>

                                {/* AI Roadmap Generator */}
                                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-4 h-4 text-purple-400" />
                                        <span className="text-xs font-black text-purple-400 uppercase tracking-widest">AI Roadmap Generator</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                        <input value={aiRoadmapTopic} onChange={e => setAiRoadmapTopic(e.target.value)} placeholder="e.g. React, System Design..."
                                            className="col-span-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50" />
                                        <select value={aiRoadmapDifficulty} onChange={e => setAiRoadmapDifficulty(e.target.value)}
                                            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                                        </select>
                                        <input value={aiRoadmapRole} onChange={e => setAiRoadmapRole(e.target.value)} placeholder="Target Role (e.g. SDE-1)"
                                            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50" />
                                        <button onClick={handleAIRoadmap} disabled={aiRoadmapGenerating}
                                            className="bg-purple-600 text-white rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-500 transition-all disabled:opacity-50">
                                            {aiRoadmapGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            {aiRoadmapGenerating ? 'Generating...' : 'Generate'}
                                        </button>
                                    </div>
                                </div>

                                {/* Create Roadmap Form */}
                                <AnimatePresence>
                                    {showAddRoadmap && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-5 overflow-hidden">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-black text-white">
                                                    {isEditingRoadmap ? 'Edit Official Roadmap' : 'Create Official Roadmap'}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    {isEditingRoadmap && (
                                                        <button onClick={() => { setShowAddRoadmap(false); setIsEditingRoadmap(false); }}
                                                            className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Cancel Edit</button>
                                                    )}
                                                    <button onClick={() => setShowAddRoadmap(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                                                </div>
                                            </div>

                                            {/* Basic Info */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField label="Title" value={roadmapForm.title} onChange={v => setRoadmapForm({ ...roadmapForm, title: v })} placeholder="React Mastery Roadmap" />
                                                <InputField label="Topic" value={roadmapForm.topic} onChange={v => setRoadmapForm({ ...roadmapForm, topic: v })} placeholder="Web Development" />
                                            </div>
                                            <TextArea label="Description" value={roadmapForm.description} onChange={v => setRoadmapForm({ ...roadmapForm, description: v })} rows={3} placeholder="A comprehensive roadmap to master..." />
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Difficulty</label>
                                                    <select value={roadmapForm.difficulty} onChange={e => setRoadmapForm({ ...roadmapForm, difficulty: e.target.value })}
                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                                        <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                                                    </select>
                                                </div>
                                                <InputField label="Total Duration" value={roadmapForm.totalDuration} onChange={v => setRoadmapForm({ ...roadmapForm, totalDuration: v })} placeholder="6 Weeks" />
                                                <InputField label="Tags (comma-separated)" value={roadmapForm.tags} onChange={v => setRoadmapForm({ ...roadmapForm, tags: v })} placeholder="react, hooks, frontend" />
                                            </div>

                                            {/* Enhanced Metadata */}
                                            <div className="border-t border-white/5 pt-4 space-y-4">
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Learning Intelligence</span>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <ArrayField label="Learning Goals" values={roadmapForm.learningGoals} onChange={v => setRoadmapForm({ ...roadmapForm, learningGoals: v })} />
                                                    <ArrayField label="Target Roles" values={roadmapForm.targetRoles} onChange={v => setRoadmapForm({ ...roadmapForm, targetRoles: v })} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <ArrayField label="Expected Outcomes" values={roadmapForm.expectedOutcomes} onChange={v => setRoadmapForm({ ...roadmapForm, expectedOutcomes: v })} />
                                                    <ArrayField label="Skills Covered" values={roadmapForm.skillsCovered} onChange={v => setRoadmapForm({ ...roadmapForm, skillsCovered: v })} />
                                                </div>
                                                <ArrayField label="Prerequisites" values={roadmapForm.prerequisites} onChange={v => setRoadmapForm({ ...roadmapForm, prerequisites: v })} />
                                            </div>

                                            {/* Modules */}
                                            <div className="border-t border-white/5 pt-4">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Modules ({roadmapForm.modules.length})</label>
                                                {roadmapForm.modules.map((mod, i) => {
                                                    const updateMod = (key, val) => {
                                                        const n = [...roadmapForm.modules];
                                                        n[i] = { ...n[i], [key]: val };
                                                        setRoadmapForm({ ...roadmapForm, modules: n });
                                                    };
                                                    return (
                                                        <div key={i} className="bg-black/20 rounded-xl p-5 mb-4 space-y-4 border border-white/5">
                                                            {/* Module Header */}
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="w-8 h-8 rounded-lg bg-primary-600/20 border border-primary-500/20 flex items-center justify-center text-xs font-black text-primary-400">{i + 1}</span>
                                                                    <span className="text-xs font-black text-white">{mod.title || `Module ${i + 1}`}</span>
                                                                </div>
                                                                {roadmapForm.modules.length > 1 && (
                                                                    <button onClick={() => setRoadmapForm({ ...roadmapForm, modules: roadmapForm.modules.filter((_, j) => j !== i) })}
                                                                        className="text-rose-500 text-[10px] hover:bg-rose-500/10 px-2 py-1 rounded">Remove</button>
                                                                )}
                                                            </div>

                                                            {/* Basic module info */}
                                                            <div className="grid grid-cols-3 gap-3">
                                                                <input value={mod.title} onChange={e => updateMod('title', e.target.value)}
                                                                    placeholder="Module Title" className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                                                                <input value={mod.estimatedTime} onChange={e => updateMod('estimatedTime', e.target.value)}
                                                                    placeholder="Est. Time (e.g., 4 hours)" className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                                                                <select value={mod.difficulty} onChange={e => updateMod('difficulty', e.target.value)}
                                                                    className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                                                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                                                                </select>
                                                            </div>
                                                            <textarea value={mod.description} onChange={e => updateMod('description', e.target.value)}
                                                                placeholder="Module Description — what the learner will cover and why" rows={2}
                                                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none resize-none" />

                                                            {/* Objectives + Concepts */}
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <ArrayField label="Objectives" values={mod.objectives || ['']} onChange={v => updateMod('objectives', v)} />
                                                                <ArrayField label="Key Concepts" values={mod.keyConcepts || ['']} onChange={v => updateMod('keyConcepts', v)} />
                                                            </div>

                                                            {/* Practice Problems */}
                                                            <div className="bg-slate-900/50 rounded-lg p-3 border border-blue-500/10">
                                                                <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Practice Problems</label>
                                                                {(mod.practiceProblems || []).map((pp, pi) => (
                                                                    <div key={pi} className="flex gap-2 mb-2">
                                                                        <input value={pp.title} onChange={e => { const n = [...(mod.practiceProblems || [])]; n[pi] = { ...n[pi], title: e.target.value }; updateMod('practiceProblems', n); }}
                                                                            placeholder="Problem name" className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" />
                                                                        {pp.source === 'internal' ? (
                                                                            <select value={pp.url} onChange={e => {
                                                                                const n = [...(mod.practiceProblems || [])];
                                                                                const selectedProblem = problems.find(p => `/problems/${p.slug}` === e.target.value);
                                                                                n[pi] = {
                                                                                    ...n[pi],
                                                                                    url: e.target.value,
                                                                                    title: selectedProblem?.title || n[pi].title,
                                                                                    difficulty: selectedProblem?.difficulty || n[pi].difficulty
                                                                                };
                                                                                updateMod('practiceProblems', n);
                                                                            }}
                                                                                className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none">
                                                                                <option value="">Select Internal Problem</option>
                                                                                {problems.map(p => (
                                                                                    <option key={p._id} value={`/problems/${p.slug}`}>{p.title} ({p.difficulty})</option>
                                                                                ))}
                                                                            </select>
                                                                        ) : (
                                                                            <input value={pp.url} onChange={e => { const n = [...(mod.practiceProblems || [])]; n[pi] = { ...n[pi], url: e.target.value }; updateMod('practiceProblems', n); }}
                                                                                placeholder="https://leetcode.com/problems/..." className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" />
                                                                        )}
                                                                        <select value={pp.difficulty} onChange={e => { const n = [...(mod.practiceProblems || [])]; n[pi] = { ...n[pi], difficulty: e.target.value }; updateMod('practiceProblems', n); }}
                                                                            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none w-24">
                                                                            <option>Easy</option><option>Medium</option><option>Hard</option>
                                                                        </select>
                                                                        <select value={pp.source || 'external'} onChange={e => { const n = [...(mod.practiceProblems || [])]; n[pi] = { ...n[pi], source: e.target.value }; updateMod('practiceProblems', n); }}
                                                                            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none w-24">
                                                                            <option value="external">External</option>
                                                                            <option value="internal">Internal</option>
                                                                        </select>
                                                                        <button onClick={() => { const n = (mod.practiceProblems || []).filter((_, j) => j !== pi); updateMod('practiceProblems', n); }}
                                                                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded"><X className="w-3 h-3" /></button>
                                                                    </div>
                                                                ))}
                                                                <button onClick={() => updateMod('practiceProblems', [...(mod.practiceProblems || []), { title: '', url: '', difficulty: 'Medium', source: 'external' }])}
                                                                    className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">+ Add Problem</button>
                                                            </div>

                                                            {/* Learning Resources */}
                                                            <div className="bg-slate-900/50 rounded-lg p-3 border border-emerald-500/10">
                                                                <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Learning Resources</label>
                                                                {(mod.learningResources || []).map((lr, li) => (
                                                                    <div key={li} className="flex gap-2 mb-2">
                                                                        <input value={lr.title} onChange={e => { const n = [...(mod.learningResources || [])]; n[li] = { ...n[li], title: e.target.value }; updateMod('learningResources', n); }}
                                                                            placeholder="Resource title" className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" />
                                                                        {lr.source === 'internal' ? (
                                                                            <select value={lr.url} onChange={e => {
                                                                                const n = [...(mod.learningResources || [])];
                                                                                const selectedKnowledge = knowledge.find(k => `/knowledge/${k.slug}` === e.target.value);
                                                                                n[li] = {
                                                                                    ...n[li],
                                                                                    url: e.target.value,
                                                                                    title: selectedKnowledge?.topic || n[li].title,
                                                                                    type: 'doc'
                                                                                };
                                                                                updateMod('learningResources', n);
                                                                            }}
                                                                                className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none">
                                                                                <option value="">Select Knowledge Doc</option>
                                                                                {knowledge.map(k => (
                                                                                    <option key={k._id} value={`/knowledge/${k.slug}`}>{k.topic} ({k.category})</option>
                                                                                ))}
                                                                            </select>
                                                                        ) : (
                                                                            <input value={lr.url} onChange={e => { const n = [...(mod.learningResources || [])]; n[li] = { ...n[li], url: e.target.value }; updateMod('learningResources', n); }}
                                                                                placeholder="https://docs.example.com/..." className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" />
                                                                        )}
                                                                        <select value={lr.type} onChange={e => { const n = [...(mod.learningResources || [])]; n[li] = { ...n[li], type: e.target.value }; updateMod('learningResources', n); }}
                                                                            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none w-24">
                                                                            <option value="doc">Doc</option><option value="article">Article</option><option value="video">Video</option><option value="course">Course</option>
                                                                        </select>
                                                                        <select value={lr.source || 'external'} onChange={e => { const n = [...(mod.learningResources || [])]; n[li] = { ...n[li], source: e.target.value }; updateMod('learningResources', n); }}
                                                                            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none w-24">
                                                                            <option value="external">External</option>
                                                                            <option value="internal">Internal</option>
                                                                        </select>
                                                                        <button onClick={() => { const n = (mod.learningResources || []).filter((_, j) => j !== li); updateMod('learningResources', n); }}
                                                                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded"><X className="w-3 h-3" /></button>
                                                                    </div>
                                                                ))}
                                                                <button onClick={() => updateMod('learningResources', [...(mod.learningResources || []), { title: '', url: '', type: 'doc', source: 'external' }])}
                                                                    className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">+ Add Resource</button>
                                                            </div>

                                                            {/* Interview & Effort Signals */}
                                                            <div className="grid grid-cols-4 gap-3">
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Interview Importance</label>
                                                                    <select value={mod.interviewImportance} onChange={e => updateMod('interviewImportance', e.target.value)}
                                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                                                                        <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Concept Weight (1-10)</label>
                                                                    <input type="number" min={1} max={10} value={mod.conceptWeight} onChange={e => updateMod('conceptWeight', parseInt(e.target.value) || 5)}
                                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Reading (min)</label>
                                                                    <input type="number" value={mod.effortEstimate?.readingMinutes || 30} onChange={e => updateMod('effortEstimate', { ...mod.effortEstimate, readingMinutes: parseInt(e.target.value) || 0 })}
                                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Practice (min)</label>
                                                                    <input type="number" value={mod.effortEstimate?.practiceMinutes || 45} onChange={e => updateMod('effortEstimate', { ...mod.effortEstimate, practiceMinutes: parseInt(e.target.value) || 0 })}
                                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                                                                </div>
                                                            </div>

                                                            {/* Unlock Criteria */}
                                                            <div className="bg-slate-900/50 rounded-lg p-3 border border-amber-500/10">
                                                                <label className="block text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Unlock Criteria</label>
                                                                <div className="grid grid-cols-3 gap-3">
                                                                    <div>
                                                                        <label className="block text-[9px] text-slate-500 mb-1">Mastery Threshold %</label>
                                                                        <input type="number" min={0} max={100} value={mod.unlockCriteria?.masteryThreshold || 0}
                                                                            onChange={e => updateMod('unlockCriteria', { ...mod.unlockCriteria, masteryThreshold: parseInt(e.target.value) || 0 })}
                                                                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[9px] text-slate-500 mb-1">Quiz Score %</label>
                                                                        <input type="number" min={0} max={100} value={mod.unlockCriteria?.quizScore || 0}
                                                                            onChange={e => updateMod('unlockCriteria', { ...mod.unlockCriteria, quizScore: parseInt(e.target.value) || 0 })}
                                                                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[9px] text-slate-500 mb-1">Problems Solved</label>
                                                                        <input type="number" min={0} value={mod.unlockCriteria?.problemsSolved || 0}
                                                                            onChange={e => updateMod('unlockCriteria', { ...mod.unlockCriteria, problemsSolved: parseInt(e.target.value) || 0 })}
                                                                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div className="flex gap-4">
                                                    <button onClick={() => setRoadmapForm({ ...roadmapForm, modules: [...roadmapForm.modules, { ...defaultModule }] })}
                                                        className="flex-1 py-3 bg-slate-800 border border-white/5 text-slate-400 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-700 hover:text-white transition-all">
                                                        + Add Manual Module
                                                    </button>
                                                    <button
                                                        onClick={() => handleAddAIModule()}
                                                        disabled={isModuleGenerating}
                                                        className="flex-1 py-3 bg-primary-600/10 border border-primary-500/20 text-primary-400 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary-600/20 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                                        {isModuleGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                        + AI Add Module
                                                    </button>
                                                </div>
                                            </div>

                                            <button onClick={handleCreateRoadmap}
                                                className={`w-full py-4 ${isEditingRoadmap ? 'bg-amber-600 shadow-amber-500/20' : 'bg-emerald-600 shadow-emerald-500/20'} text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg`}>
                                                <Save className="w-4 h-4" /> {isEditingRoadmap ? 'Update Roadmap' : 'Publish Roadmap'}
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Roadmap List */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {roadmaps.map(r => (
                                        <div key={r._id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-primary-500/20 transition-all group">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">{r.title}</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">{r.topic} • by {r.user?.name || 'Admin'}</p>
                                                </div>
                                                <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => handleEditRoadmap(r)}
                                                        className="p-2 text-primary-400 hover:bg-primary-500/10 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteRoadmap(r._id, r.title)}
                                                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 mb-3 line-clamp-2">{r.description || 'No description'}</p>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                                <span>{r.modules?.length || 0} modules</span>
                                                <span>•</span>
                                                <span>{r.difficulty}</span>
                                                <span>•</span>
                                                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
