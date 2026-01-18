import { Link } from 'react-router-dom';

const Home = () => {
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
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link to="/signup" className="btn-primary text-lg">
            Get Started Free
          </Link>
          <Link to="/login" className="btn-secondary text-lg">
            Sign In
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-8">
        <h2 className="text-4xl font-bold text-center mb-12">Why Choose LearnSphere AI?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="card-hover group">
            <div className="text-4xl mb-4 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
              🗺️
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Roadmaps</h3>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Progress Tracking</h3>
            <p className="text-gray-600 leading-relaxed">
              Visualize your learning journey with detailed analytics. See your strengths, weaknesses, and progress at a glance.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-12 text-center text-white space-y-4">
        <h2 className="text-3xl font-bold">Ready to Start Learning?</h2>
        <p className="text-lg text-indigo-100">Join thousands of learners already using LearnSphere AI</p>
        <Link to="/signup" className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-bold hover:bg-indigo-50 transition">
          Sign Up Now
        </Link>
      </div>
    </div>
  );
};

export default Home;