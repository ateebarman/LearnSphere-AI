import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { sendTutorMessage } from '../services/tutorService';
import { FaSpinner, FaPaperPlane } from 'react-icons/fa';

const TutorChat = () => {
  const { token } = useAuthStore();
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
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    setError('');

    // Add user message to chat
    const userMessage = { role: 'user', content: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Send message with history to tutor service
      const reply = await sendTutorMessage(trimmedInput, messages, token);

      // Add assistant message to chat
      const assistantMessage = { role: 'assistant', content: reply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message || 'Tutor failed to respond. Please try again.');
      console.error('Tutor error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear chat history
  const handleClearChat = () => {
    setMessages([]);
    setError('');
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-md border-b-2 border-indigo-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            🎓 AI Tutor Chat
          </h1>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-semibold transition duration-200"
            >
              Clear Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to AI Tutor</h2>
              <p className="text-gray-600 text-lg max-w-md">
                Ask me anything about coding, programming, web development, data structures, algorithms, and more. I'm here to help explain concepts step-by-step with examples!
              </p>
            </div>
          )}

          {/* Display Messages */}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  {/* Basic markdown rendering for code blocks and formatting */}
                  {msg.content.split('\n').map((line, i) => {
                    if (line.startsWith('```')) {
                      return null;
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return (
                        <div key={i} className="ml-4">
                          • {line.slice(2)}
                        </div>
                      );
                    }
                    if (line.match(/^\d+\. /)) {
                      return (
                        <div key={i} className="ml-4">
                          {line}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={i}
                        className={line ? '' : 'h-2'}
                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none flex items-center space-x-2">
                <FaSpinner className="animate-spin" />
                <span>Tutor is thinking...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded max-w-2xl">
                <p className="font-semibold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white border-t-2 border-indigo-100 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask me anything about coding and programming..."
              className="flex-1 px-4 py-3 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200"
            >
              {loading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <>
                  <FaPaperPlane /> Send
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Chat history is limited to the last 12 messages for better performance
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorChat;
