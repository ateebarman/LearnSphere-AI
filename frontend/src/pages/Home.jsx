import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'framer-motion';
import {
  Rocket, Map, CheckCircle, PieChart, Bot, BookOpen,
  Users, Zap, ShieldCheck, GraduationCap, ArrowRight, Sparkles
} from 'lucide-react';

const Home = () => {
  const { userInfo } = useAuthStore();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-screen pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px] animate-slow-drift will-change-transform" />
        <div className="absolute bottom-[20%] right-[-5%] w-[35%] h-[35%] bg-secondary-500/10 rounded-full blur-[100px] animate-slow-drift will-change-transform" style={{ animationDelay: '-5s' }} />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <motion.div
          className="text-center space-y-8 max-w-4xl mx-auto"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeIn}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-card border-primary-500/20 text-primary-700 dark:text-primary-300 font-medium text-sm mb-4 ring-1 ring-primary-500/10"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Learning Transformation</span>
          </motion.div>

          <motion.h1
            variants={fadeIn}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] font-display"
          >
            Master Anything with{' '}
            <span className="text-gradient">LearnSphere AI</span>
          </motion.h1>

          <motion.p
            variants={fadeIn}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Your ultimate personalized ecosystem. Build custom roadmaps, practice with AI tutors, and track your growth in real-time.
          </motion.p>

          <motion.div
            variants={fadeIn}
            className="flex flex-col sm:flex-row gap-5 justify-center pt-8"
          >
            {userInfo ? (
              <Link to="/dashboard" className="btn-primary text-lg group">
                Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn-primary text-lg px-10">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn-secondary text-lg px-10">
                  Sign In
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-display">Engineered for Success</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">Every feature is designed to cut down your learning curve and maximize retention.</p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {[
            { icon: Map, title: "Smart Roadmaps", color: "primary", desc: "AI-generated paths tailored to your current level and ultimate career goals." },
            { icon: CheckCircle, title: "Adaptive Quizzes", color: "secondary", desc: "Dynamic assessments that identify and bridge your knowledge gaps instantly." },
            { icon: PieChart, title: "Advanced Analytics", color: "primary", desc: "Visualize your progress with data-rich charts and actionable insights." },
            { icon: Bot, title: "24/7 AI Tutor", color: "secondary", desc: "Immediate answers and explanations for complex concepts, whenever you need them." },
            { icon: BookOpen, title: "Knowledge Library", color: "primary", desc: "A vast repository of curated resources, intelligently organized for your path." },
            { icon: Users, title: "Community Insights", color: "secondary", desc: "Learn from top performers and share your winning strategies with the world." }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={fadeIn}
              className="card-premium group"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors group-hover:scale-110 transition-transform duration-300 ${feature.color === 'primary'
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400'
                : 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/40 dark:text-secondary-400'
                }`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3 font-display">{feature.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Premium CTA / Difference */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="card-premium grid grid-cols-1 lg:grid-cols-2 gap-16 p-8 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-32 -mt-32" />

          <div className="space-y-8 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight font-display">Technologically <span className="text-gradient">Superior</span> Learning</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
              We leverage the latest in Large Language Models and cognitive science to provide a learning experience that traditional platforms simply can't match.
            </p>

            <div className="space-y-6 pt-4">
              {[
                { icon: Zap, title: "Intelligent Adaptation", desc: "The platform evolves with you, constantly refining your path." },
                { icon: ShieldCheck, title: "Secure & Private", desc: "Your data and progress are encrypted and strictly private." },
                { icon: GraduationCap, title: "Science-Based Methods", desc: "Optimized for active recall and spaced repetition." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-5 group">
                  <div className="flex-shrink-0 w-12 h-12 glass-card flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold font-display">{item.title}</h4>
                    <p className="text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center justify-center p-12 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-center relative z-10 space-y-6">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex items-center justify-center mx-auto transform -rotate-12 group-hover:rotate-0 transition-all duration-500 ring-1 ring-slate-200 dark:ring-slate-800">
                <Bot className="w-12 h-12 text-primary-600" />
              </div>
              <p className="text-2xl font-medium text-slate-800 dark:text-slate-100 italic font-display">
                "LearnSphere AI helped me master Python 3x faster than traditional online courses."
              </p>
              <div className="text-slate-500 dark:text-slate-400 font-semibold">— Sarah J., Senior Dev</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <motion.div
          className="max-w-5xl mx-auto rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden bg-primary-600"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-400/20 rounded-full blur-[100px] -ml-48 -mb-48" />

          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-black font-display tracking-tight">Ready to Elevate <br />Your Future?</h2>
            <p className="text-xl text-primary-100 opacity-90 max-w-xl mx-auto">Join the next generation of proactive learners and start your journey today.</p>
            <div className="pt-8">
              {userInfo ? (
                <Link to="/dashboard" className="inline-flex bg-white text-primary-600 px-12 py-5 rounded-2xl font-bold hover:bg-slate-50 transition-all transform hover:scale-105 shadow-2xl shadow-black/20 text-lg">
                  Access Your Dashboard
                </Link>
              ) : (
                <Link to="/signup" className="inline-flex bg-white text-primary-600 px-12 py-5 rounded-2xl font-bold hover:bg-slate-50 transition-all transform hover:scale-105 shadow-2xl shadow-black/20 text-lg">
                  Join for Free
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 text-center text-slate-500 border-t border-slate-200 dark:border-slate-800">
        <p>© {new Date().getFullYear()} LearnSphere AI. Empowering minds globally.</p>
      </footer>
    </div>
  );
};

export default Home;
