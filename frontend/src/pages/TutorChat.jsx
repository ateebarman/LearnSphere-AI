import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { sendTutorMessage } from '../services/tutorService';
import { FaSpinner, FaPaperPlane, FaRobot, FaUser, FaTrash, FaGraduationCap } from 'react-icons/fa';

const TutorChat = () => {
  const { token, userInfo } = useAuthStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
      const reply = await sendTutorMessage(trimmedInput, messages, token);
      const assistantMessage = { role: 'assistant', content: reply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message || 'Tutor failed to respond. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all messages?')) {
      setMessages([]);
      setError('');
      setInput('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gradient flex items-center gap-3">
            <FaGraduationCap className="text-indigo-600" />
            AI Tutor
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Your personal 24/7 coding mentor</p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all border border-red-100 dark:border-red-900/50"
          >
            <FaTrash />
            Clear Session
          </button>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="card-premium flex-grow overflow-hidden flex flex-col p-0 border-none shadow-2xl">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth custom-scrollbar">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-80 animate-in fade-in zoom-in duration-700">
              <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center text-5xl text-indigo-600/80">
                <FaRobot />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black dark:text-white">Hello, {userInfo?.name.split(' ')[0]}!</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
                  I'm your AI Tutor. Ask me about React, Node.js, System Design, or anything you're curious about!
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-md pt-4">
                {['Explain Closures in JS', 'What is Redux?', 'Explain OOP', 'How to use Tailwind?'].map(q => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="p-3 text-xs font-bold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700 rounded-xl hover:border-indigo-500 transition-all text-left"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse animate-in slide-in-from-right duration-300' : 'animate-in slide-in-from-left duration-300'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 border dark:border-gray-700 text-indigo-600'
                }`}>
                {msg.role === 'user' ? <FaUser /> : <FaRobot />}
              </div>

              <div className={`max-w-[80%] space-y-2`}>
                <div className={`text-[10px] font-black uppercase tracking-widest text-gray-400 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.role === 'user' ? 'You' : 'AI Tutor'}
                </div>
                <div
                  className={`px-5 py-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-gray-50 dark:bg-gray-800/80 border dark:border-gray-700 dark:text-gray-200 rounded-tl-none'
                    }`}
                >
                  <div className="whitespace-pre-wrap break-words font-medium">
                    {msg.content}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-4 animate-in fade-in duration-300">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-lg">
                <FaRobot className="animate-pulse" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 rounded-2xl rounded-tl-none border dark:border-gray-700 flex items-center gap-3">
                <FaSpinner className="animate-spin text-indigo-600" />
                <span className="text-sm font-bold text-gray-400">Tutor is typing...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center py-4">
              <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-r-xl max-w-2xl text-sm font-bold flex items-center gap-3 shadow-sm shadow-red-500/10">
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-xs">!</span>
                {error}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-6 bg-white dark:bg-gray-950 border-t dark:border-gray-800 relative">
          <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Type your question here..."
              className="flex-1 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-indigo-600 dark:focus:border-indigo-500 py-4 px-6 rounded-2xl focus:outline-none transition-all disabled:opacity-50 font-medium dark:text-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-800 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all shrink-0"
            >
              {loading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaPaperPlane className="text-xl" />
              )}
            </button>
          </form>
          <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
            Active Learning Session
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorChat;
