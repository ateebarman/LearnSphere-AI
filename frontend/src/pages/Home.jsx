import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const Home = () => {
  const token = useAuthStore((state) => state.token);

  return (
    <div className="space-y-16 py-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <h1 className="text-6xl md:text-7xl font-bold leading-tight">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
            LearnSphere AI
          </span>
        </h1>
        <p className="text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Your personalized, AI-powered learning companion. Master any topic with adaptive learning paths and real-time feedback.
        </p>
        {token ? (
          <div className="flex justify-center pt-4">
            <Link to="/dashboard" className="btn-primary text-lg">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/signup" className="btn-primary text-lg">
              Get Started Free
            </Link>
            <Link to="/login" className="btn-secondary text-lg">
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="space-y-8">
        <h2 className="text-4xl font-bold text-center mb-12">Why Choose LearnSphere AI?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="card-hover group">
            <div className="text-4xl mb-4 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
              🗺️
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">AI-Powered Roadmaps</h3>
            <p className="text-gray-600 leading-relaxed">
              Get a personalized, step-by-step learning plan for any topic. Our AI understands your level and creates the perfect path forward.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card-hover group">
            <div className="text-4xl mb-4 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
              ✅
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Dynamic Quizzes</h3>
            <p className="text-gray-600 leading-relaxed">
              Test your knowledge with intelligent quizzes that adapt to your learning. Get instant feedback and identify weak areas instantly.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card-hover group">
            <div className="text-4xl mb-4 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
              📊
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Advanced Analytics</h3>
            <p className="text-gray-600 leading-relaxed">
              Visualize your learning journey with detailed analytics. Track quiz performance, roadmap progress, and achievement metrics.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="card-hover group">
            <div className="text-4xl mb-4 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
              🤖
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Tutor Chat</h3>
            <p className="text-gray-600 leading-relaxed">
              Get instant help with your learning. Chat with our AI tutor powered by advanced LLM technology for real-time explanations and guidance.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="card-hover group">
            <div className="text-4xl mb-4 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
              📚
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Resource Library</h3>
            <p className="text-gray-600 leading-relaxed">
              Access a curated collection of learning resources including videos, articles, and tutorials. Search and explore content across any topic.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="card-hover group">
            <div className="text-4xl mb-4 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
              🌐
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Community Roadmaps</h3>
            <p className="text-gray-600 leading-relaxed">
              Explore and clone roadmaps created by the community. Share your learning paths and learn from others' experiences and insights.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="space-y-12">
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/40 rounded-2xl p-12 border-2 border-indigo-200 dark:border-indigo-500/20">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">What Makes Us Different?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Intelligent Adaptation</h4>
                <p className="text-gray-600 dark:text-gray-400">The platform adapts to your learning speed and style, ensuring optimal learning outcomes.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">🔒</span>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Secure & Private</h4>
                <p className="text-gray-600 dark:text-gray-400">JWT-based authentication ensures your data and learning progress are always secure.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">🎓</span>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Proven Learning Science</h4>
                <p className="text-gray-600 dark:text-gray-400">Based on spaced repetition and active recall for better knowledge retention.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">🚀</span>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Always Improving</h4>
                <p className="text-gray-600 dark:text-gray-400">Our AI continuously learns from your interactions to provide better recommendations.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-12 text-center text-white space-y-4">
          <h2 className="text-3xl font-bold">Ready to Start Learning?</h2>
          <p className="text-lg text-indigo-100">Join thousands of learners already using LearnSphere AI</p>
          {token ? (
            <Link to="/dashboard" className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-bold hover:bg-indigo-50 transition">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/signup" className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-bold hover:bg-indigo-50 transition">
              Sign Up Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;