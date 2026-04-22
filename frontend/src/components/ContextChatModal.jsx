import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaUser, FaPaperPlane, FaTimes, FaSpinner, FaBrain } from 'react-icons/fa';
import { sendTutorMessage } from '../services/tutorService';
import { useAuthStore } from '../store/useAuthStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ContextChatModal = ({ isOpen, onClose, context }) => {
    const { token, userInfo } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Initial summary message from AI
    useEffect(() => {
        if (isOpen && context && messages.length === 0) {
            const initialGreeting = `Hello ${userInfo?.name?.split(' ')[0] || 'there'}! I've loaded the context for **"${context.title}"** (${context.type}). \n\nHow can I help you understand this better?`;
            setMessages([{ role: 'assistant', content: initialGreeting }]);
        }
    }, [isOpen, context, userInfo]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || loading) return;

        setError('');
        const userMessage = { role: 'user', content: trimmedInput };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const reply = await sendTutorMessage(trimmedInput, messages, token, context);
            const assistantMessage = { role: 'assistant', content: reply };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            setError(err || 'Failed to get a response. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop with Blur */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-gray-950 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] border dark:border-gray-800"
                >
                    {/* Header */}
                    <div className="p-5 border-b dark:border-gray-800 flex items-center justify-between bg-indigo-600">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                                <FaBrain className="text-xl" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-sm uppercase tracking-wider">Ask AI: {context?.title}</h3>
                                <div className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                    Contextual Session
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-indigo-600'
                                    }`}>
                                    {msg.role === 'user' ? <FaUser size={12} /> : <FaRobot size={12} />}
                                </div>
                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : 'bg-gray-100 dark:bg-gray-800/80 dark:text-gray-200 border dark:border-gray-700 rounded-tl-none'
                                    }`}>
                                    <div className="prose dark:prose-invert prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-indigo-600 flex items-center justify-center">
                                    <FaRobot size={12} className="animate-pulse" />
                                </div>
                                <div className="bg-gray-100 dark:bg-gray-800/50 px-4 py-2 rounded-2xl rounded-tl-none border dark:border-gray-700 flex items-center gap-2">
                                    <FaSpinner size={10} className="animate-spin text-indigo-600" />
                                    <span className="text-[10px] font-black uppercase text-gray-400">Thinking...</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-lg border border-red-100 dark:border-red-900/50">
                                {error}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-800">
                        <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question about this topic..."
                                className="flex-1 bg-white dark:bg-gray-950 border dark:border-gray-800 text-sm py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium dark:text-white"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-3 rounded-xl shadow-lg transition-all"
                            >
                                {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ContextChatModal;
