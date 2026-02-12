import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { FaRocket, FaMapMarkedAlt, FaCheckCircle, FaChartPie, FaRobot, FaBook, FaUsers, FaBolt, FaShieldAlt, FaGraduationCap } from 'react-icons/fa';

const Home = () => {
  const { userInfo } = useAuthStore();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-6 bg-hero-gradient rounded-3xl mb-16">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium text-sm mb-4">
            <FaRocket className="text-xs" />
            <span>The Future of Learning is Here</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Elevate Your Skills with{' '}
            <span className="text-gradient">LearnSphere AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Your personalized, AI-powered learning ecosystem. Master complex topics with adaptive paths and real-time guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8">
            {userInfo ? (
              <Link to="/dashboard" className="btn-primary text-lg px-12 py-4 flex items-center justify-center space-x-3">
                <span>Go to Dashboard</span>
                <FaRocket />
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn-primary text-lg px-10 py-4">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn-secondary text-lg px-10 py-4">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold">Why Choose LearnSphere AI?</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Powerful features designed to accelerate your learning journey and help you achieve your goals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
          <div className="card-hover group">
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-2xl text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <FaMapMarkedAlt />
            </div>
            <h3 className="text-2xl font-bold mb-3">AI-Powered Roadmaps</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Unlock a personalized, data-driven journey for any subject. Our intelligence engine adapts to your pace and goals perfectly.
            </p>
          </div>

          <div className="card-hover group">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center text-2xl text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <FaCheckCircle />
            </div>
            <h3 className="text-2xl font-bold mb-3">Dynamic Quizzes</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Challenge yourself with adaptive assessments. Get instant insights into your strength and target areas for improvement.
            </p>
          </div>

          <div className="card-hover group">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center text-2xl text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <FaChartPie />
            </div>
            <h3 className="text-2xl font-bold mb-3">Deep Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Visualize your progress with stunning data visualizations. Track your evolution and celebrate every milestone achieved.
            </p>
          </div>

          <div className="card-hover group">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center text-2xl text-green-600 dark:text-green-400 mb-6 group-hover:scale-110 transition-transform">
              <FaRobot />
            </div>
            <h3 className="text-2xl font-bold mb-3">24/7 AI Tutor</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Never get stuck again. Our advanced AI tutor is available anytime to clarify concepts and answer your questions.
            </p>
          </div>

          <div className="card-hover group">
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/50 rounded-2xl flex items-center justify-center text-2xl text-orange-600 dark:text-orange-400 mb-6 group-hover:scale-110 transition-transform">
              <FaBook />
            </div>
            <h3 className="text-2xl font-bold mb-3">Curated Content</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Access the world's best learning materials, handpicked and organized by our AI to match your specific learning path.
            </p>
          </div>

          <div className="card-hover group">
            <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/50 rounded-2xl flex items-center justify-center text-2xl text-pink-600 dark:text-pink-400 mb-6 group-hover:scale-110 transition-transform">
              <FaUsers />
            </div>
            <h3 className="text-2xl font-bold mb-3">Community Wisdom</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Collaborate and learn from a global community. share your roadmaps and discover winning strategies from experts.
            </p>
          </div>
        </div>
      </section>

      {/* Difference Section */}
      <section className="py-20">
        <div className="card-premium grid grid-cols-1 lg:grid-cols-2 gap-12 p-8 md:p-16">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">What Makes Us Truly Different?</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              We've combined modern pedagogy with cutting-edge AI to create a learning experience that's as unique as you are.
            </p>
            <div className="space-y-4 pt-4">
              {[
                { icon: <FaBolt />, title: "Intelligent Adaptation", desc: "The platform evolves with you, constantly refining your path." },
                { icon: <FaShieldAlt />, title: "Secure & Trusted", desc: "Your data and progress are protected with bank-grade security." },
                { icon: <FaGraduationCap />, title: "Science-Based", desc: "Built on principles of active recall and spaced repetition." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">{item.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-indigo-600/5 dark:bg-indigo-400/5 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center p-12 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-center relative z-10 space-y-6">
              <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-3xl shadow-xl flex items-center justify-center text-4xl text-indigo-600 mx-auto transform -rotate-6 group-hover:rotate-0 transition-transform">
                <FaRobot />
              </div>
              <p className="text-xl font-medium text-indigo-700 dark:text-indigo-300 italic">
                "LearnSphere AI helped me master Python 3x faster than traditional online courses."
              </p>
              <div className="text-gray-500 dark:text-gray-400 font-semibold">— Sarah J., Software Engineer</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="bg-indigo-600 dark:bg-indigo-700 rounded-3xl p-12 md:p-20 text-center text-white space-y-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>

          <div className="relative z-10 space-y-4">
            <h2 className="text-4xl md:text-5xl font-extrabold">Ready to Transformation?</h2>
            <p className="text-xl text-indigo-100 opacity-90">Join thousands of proactive learners today.</p>
            <div className="pt-8">
              {userInfo ? (
                <Link to="/dashboard" className="inline-block bg-white text-indigo-600 px-12 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-xl shadow-black/20">
                  Access Your Dashboard
                </Link>
              ) : (
                <Link to="/signup" className="inline-block bg-white text-indigo-600 px-12 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-xl shadow-black/20">
                  Get Started Now
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;