import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getKnowledgeNodes, getCategories, getKnowledgeDetails } from '../services/knowledgeService';
import {
    FaBook, FaCode, FaLightbulb, FaExclamationTriangle,
    FaClock, FaDatabase, FaListUl, FaSearch,
    FaChevronRight, FaArrowLeft, FaExternalLinkAlt, FaSpinner,
    FaClipboardList, FaFileAlt, FaTrophy, FaTag, FaLink,
    FaGraduationCap, FaBrain
} from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';

const KnowledgeLibrary = () => {
    const [nodes, setNodes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [detailedNode, setDetailedNode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();

    useEffect(() => {
        fetchInitialData();

        // Handle direct topic navigation from URL
        const params = new URLSearchParams(location.search);
        const topicParam = params.get('topic');
        if (topicParam) {
            handleTopicClick(topicParam);
        }
    }, [location.search]);

    useEffect(() => {
        fetchNodes();
    }, [selectedCategory]);

    const fetchInitialData = async () => {
        try {
            const cats = await getCategories();
            setCategories(['All', ...cats]);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchNodes = async () => {
        setLoading(true);
        try {
            const data = await getKnowledgeNodes(selectedCategory === 'All' ? '' : selectedCategory);
            setNodes(data);
        } catch (err) {
            console.error('Failed to fetch knowledge nodes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTopicClick = async (topic) => {
        setDetailedNode(null);
        setSelectedTopic(topic);
        setDetailLoading(true);
        try {
            const data = await getKnowledgeDetails(topic);
            setDetailedNode(data);
        } catch (err) {
            console.error('Failed to fetch details:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    const filteredNodes = nodes.filter(node =>
        node.topic.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredNodes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredNodes.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const getComplexityColor = (time) => {
        if (!time) return 'bg-gray-100 text-gray-600';
        if (time.includes('1') || time.includes('log')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        if (time.includes('n^2') || time.includes('n!')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    };

    if (loading && nodes.length === 0) {
        return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    }

    return (
        <div className="min-h-screen pb-20 mt-20">
            {selectedTopic ? (
                /* ... Detailed View logic ... */
                <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-right duration-500">
                    <button
                        onClick={() => setSelectedTopic(null)}
                        className="group flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:gap-4 transition-all"
                    >
                        <FaArrowLeft /> Back to Library
                    </button>

                    {detailLoading ? (
                        <div className="py-20 text-center"><LoadingSpinner /></div>
                    ) : detailedNode && (
                        <div className="space-y-12">
                            {/* Header */}
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest">
                                        {detailedNode.category}
                                    </span>
                                    {detailedNode.topicType && (
                                        <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-widest flex items-center gap-1">
                                            <FaBrain size={10} /> {detailedNode.topicType}
                                        </span>
                                    )}
                                    {detailedNode.difficulty && (
                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 ${detailedNode.difficulty === 'Beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : detailedNode.difficulty === 'Advanced' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            <FaGraduationCap size={10} /> {detailedNode.difficulty}
                                        </span>
                                    )}
                                    {detailedNode.complexity && (
                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 ${getComplexityColor(detailedNode.complexity.time)}`}>
                                            <FaClock size={10} /> {detailedNode.complexity.time}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <h1 className="text-6xl font-black dark:text-white leading-tight">{detailedNode.topic}</h1>
                                    <Link
                                        to={`/quiz/knowledge/${encodeURIComponent(detailedNode.topic)}`}
                                        className="btn-primary group flex items-center gap-3 px-8 py-4 shadow-xl shadow-indigo-500/20 whitespace-nowrap"
                                    >
                                        <FaClipboardList className="group-hover:rotate-12 transition-transform" />
                                        Take Topic Quiz
                                    </Link>
                                </div>
                                <p className="text-xl text-gray-600 dark:text-gray-400 font-medium border-l-4 border-indigo-600 pl-6 py-2">
                                    {detailedNode.summary}
                                </p>
                                {/* Tags */}
                                {detailedNode.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {detailedNode.tags.map((tag, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-bold">
                                                <FaTag size={8} /> {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Main Content */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                <div className="lg:col-span-2 space-y-12">
                                    {/* Intuition - ELI5 */}
                                    {detailedNode.intuition && (
                                        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-200/50 dark:border-amber-800/30 p-10">
                                            <div className="absolute top-4 right-4 text-6xl opacity-10">💡</div>
                                            <h2 className="text-2xl font-black mb-4 text-amber-800 dark:text-amber-300 flex items-center gap-3">
                                                <FaLightbulb className="text-amber-500" /> The Intuition
                                            </h2>
                                            <p className="text-lg text-amber-900/80 dark:text-amber-200/80 font-medium leading-relaxed italic">
                                                "{detailedNode.intuition}"
                                            </p>
                                        </section>
                                    )}

                                    {/* Technical Deep Dive */}
                                    <section className="card-premium p-10">
                                        <h2 className="text-2xl font-black mb-6 dark:text-white flex items-center gap-3">
                                            <FaBook className="text-indigo-600" /> Technical Deep Dive
                                        </h2>
                                        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
                                            {detailedNode.detailedContent.split('\n').map((p, i) => (
                                                <p key={i}>{p}</p>
                                            ))}
                                        </div>

                                        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                                        <FaTrophy />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black dark:text-white">Ready to test your knowledge?</h4>
                                                        <p className="text-sm text-gray-500 font-medium">Earn mastery points by passing the {detailedNode.topic} quiz.</p>
                                                    </div>
                                                </div>
                                                <Link
                                                    to={`/quiz/knowledge/${encodeURIComponent(detailedNode.topic)}`}
                                                    className="btn-primary px-10 py-3 whitespace-nowrap"
                                                >
                                                    Start Quiz
                                                </Link>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Code Snippets */}
                                    {(detailedNode.implementations?.length > 0 || detailedNode.codeSnippets?.length > 0) && (
                                        <div className="space-y-6">
                                            <h2 className="text-3xl font-black dark:text-white flex items-center gap-3">
                                                <FaCode className="text-green-500" /> Implementation Examples
                                            </h2>
                                            {(detailedNode.implementations || detailedNode.codeSnippets).map((snippet, idx) => (
                                                <div key={idx} className="card-premium p-0 overflow-hidden bg-gray-950">
                                                    <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
                                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{snippet.language}</span>
                                                        <div className="flex gap-1.5">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                                                        </div>
                                                    </div>
                                                    <pre className="p-8 overflow-x-auto text-sm font-mono text-gray-300">
                                                        <code>{snippet.code}</code>
                                                    </pre>
                                                    {snippet.explanation && (
                                                        <div className="p-6 bg-gray-900/50 border-t border-gray-800 text-sm text-gray-400 font-medium">
                                                            {snippet.explanation}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    {/* Key Principles */}
                                    <section className="card-premium border-indigo-500/10">
                                        <h3 className="text-lg font-black dark:text-white mb-6 flex items-center gap-2">
                                            <FaLightbulb size={18} className="text-yellow-500" /> Core Principles
                                        </h3>
                                        <ul className="space-y-4">
                                            {detailedNode.keyPrinciples.map((principle, idx) => (
                                                <li key={idx} className="flex gap-3 text-sm font-medium text-gray-600 dark:text-gray-400 italic">
                                                    <span className="text-indigo-600 font-black">•</span> {principle}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>

                                    {/* Common Pitfalls */}
                                    <section className="card-premium border-red-500/10 bg-red-50/10">
                                        <h3 className="text-lg font-black dark:text-white mb-6 flex items-center gap-2">
                                            <FaExclamationTriangle size={18} className="text-red-500" /> Common Pitfalls
                                        </h3>
                                        <ul className="space-y-4">
                                            {detailedNode.commonPitfalls.map((pitfall, idx) => (
                                                <li key={idx} className="flex gap-3 text-sm font-medium text-red-700/80 dark:text-red-400/80">
                                                    <FaChevronRight size={10} className="mt-1 flex-shrink-0" /> {pitfall}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>

                                    {/* Further Reading */}
                                    <section className="card-premium">
                                        <h3 className="text-lg font-black dark:text-white mb-6 flex items-center gap-2">
                                            <FaExternalLinkAlt size={16} className="text-indigo-600" /> Further Reading
                                        </h3>
                                        <div className="space-y-3">
                                            {(detailedNode.furtherReading?.length > 0 ? detailedNode.furtherReading : detailedNode.verifiedResources || []).map((res, idx) => (
                                                res.source === 'internal' && res.knowledgeRef ? (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleTopicClick(res.title)}
                                                        className="w-full flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-xl transition-all group border border-purple-200/50 dark:border-purple-800/30"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-6 h-6 rounded-md bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
                                                                <FaBook size={10} className="text-purple-600 dark:text-purple-400" />
                                                            </span>
                                                            <span className="text-sm font-bold dark:text-white text-left">{res.title}</span>
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-purple-500 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded">Internal</span>
                                                        </div>
                                                        <FaChevronRight size={12} className="text-purple-300 group-hover:text-purple-600 transition-colors" />
                                                    </button>
                                                ) : (
                                                    <a
                                                        key={idx}
                                                        href={res.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                                <FaLink size={10} className="text-blue-500" />
                                                            </span>
                                                            <span className="text-sm font-bold dark:text-white line-clamp-1">{res.title}</span>
                                                        </div>
                                                        <FaChevronRight size={12} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                                                    </a>
                                                )
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Library List View */
                <div className="max-w-7xl mx-auto space-y-12 px-4 md:px-0">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <h1 className="text-6xl font-black text-gradient">Knowledge Base</h1>
                            <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
                                Internal expert-verified documentation for masters of the trade.
                            </p>
                        </div>
                        <div className="relative group min-w-[300px]">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search topics..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl shadow-xl focus:outline-none transition-all dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-2 pb-4 overflow-x-auto">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${selectedCategory === cat
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="py-20 text-center"><LoadingSpinner /></div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {currentItems.map((node) => (
                                    <div
                                        key={node._id}
                                        onClick={() => handleTopicClick(node.topic)}
                                        className="card-hover group cursor-pointer border-none shadow-xl bg-white dark:bg-gray-900 p-8 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 transform-gpu will-change-transform"
                                    >
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded">
                                                    {node.category}
                                                </span>
                                                {node.complexity && (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                                        <FaClock size={10} /> {node.complexity.time}
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="text-2xl font-black dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-2">
                                                {node.topic}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 font-medium leading-relaxed">
                                                {node.summary}
                                            </p>
                                        </div>
                                        <div className="mt-8 flex items-center justify-between font-black text-xs text-indigo-600 group-hover:gap-2 transition-all">
                                            READ DOCUMENTATION <FaChevronRight size={10} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-4 pt-8">
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="btn-secondary disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="font-bold text-slate-500 dark:text-slate-400">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="btn-secondary disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {!loading && filteredNodes.length === 0 && (
                        <div className="py-20 text-center card-premium opacity-50">
                            <FaBook className="text-6xl mx-auto mb-6 text-gray-300" />
                            <p className="text-xl font-bold">No documentation found for this query.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default KnowledgeLibrary;
