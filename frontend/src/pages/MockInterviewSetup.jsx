import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { startInterview } from '../services/interviewService';
import toast from 'react-hot-toast';

const TOPICS = [
  { id: 'arrays', label: 'Arrays', icon: '📋' },
  { id: 'linked-lists', label: 'Linked Lists', icon: '🔗' },
  { id: 'trees', label: 'Trees', icon: '🌲' },
  { id: 'graphs', label: 'Graphs', icon: '🕸️' },
  { id: 'dynamic-programming', label: 'Dynamic Programming', icon: '⚡' },
  { id: 'strings', label: 'Strings', icon: '📝' },
  { id: 'system-design', label: 'System Design', icon: '🏗️' },
  { id: 'react', label: 'React', icon: '⚛️' },
  { id: 'javascript', label: 'JavaScript', icon: '🟨' },
  { id: 'nodejs', label: 'Node.js', icon: '🟢' },
  { id: 'databases', label: 'Databases', icon: '🗄️' },
  { id: 'os', label: 'OS Concepts', icon: '💾' },
];

const COMPANIES = [
  { id: 'generic', label: 'Standard', desc: 'General tech interview', color: 'indigo' },
  { id: 'google', label: 'Google', desc: 'Googleyness + LLD focus', color: 'green' },
  { id: 'amazon', label: 'Amazon', desc: 'Leadership principles heavy', color: 'orange' },
  { id: 'microsoft', label: 'Microsoft', desc: 'Problem solving + design', color: 'blue' },
  { id: 'meta', label: 'Meta', desc: 'Speed + optimization focused', color: 'purple' },
  { id: 'startup', label: 'Startup', desc: 'Broad skills, culture fit', color: 'pink' },
];

const MODES = [
  { id: 'mock', label: 'Full Mock', desc: 'Warm-up → Intro → Resume → DSA → HR → Feedback', icon: '🎯' },
  { id: 'technical', label: 'Technical Only', desc: 'DSA + System Design rounds', icon: '💻' },
  { id: 'behavioral', label: 'Behavioral Only', desc: 'HR + Leadership questions', icon: '🤝' },
  { id: 'coding', label: 'Coding Round', desc: 'Pure coding problems', icon: '⌨️' },
  { id: 'resume', label: 'Resume Deep Dive', desc: 'Questions from your projects', icon: '📄' },
];

const DIFFICULTIES = [
  { id: 'adaptive', label: 'Adaptive', desc: 'Adjusts to your performance' },
  { id: 'easy', label: 'Easy', desc: 'Entry-level questions' },
  { id: 'medium', label: 'Medium', desc: 'Standard interview level' },
  { id: 'hard', label: 'Hard', desc: 'Senior engineer level' },
];

export default function MockInterviewSetup() {
  const navigate = useNavigate();
  const { userInfo } = useAuthStore();
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    mode: 'mock',
    company: 'generic',
    topic: '',
    difficulty: 'adaptive',
    voiceMode: true,
    targetRole: 'Software Engineer',
  });
  const [loading, setLoading] = useState(false);

  const steps = [
    { title: 'Interview Mode', subtitle: 'What kind of interview do you want?' },
    { title: 'Company Style', subtitle: 'Simulate a specific company\'s interview style' },
    { title: 'Topic Focus', subtitle: 'Focus on a specific area (optional)' },
    { title: 'Difficulty & Settings', subtitle: 'Choose your challenge level and preferences' },
  ];

  const handleStart = async () => {
    setLoading(true);
    try {
      const data = await startInterview(config);
      if (data.success) {
        toast.success('Interview session created!');
        navigate(`/mock-interview/room/${data.interviewId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create interview session.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12 text-slate-900 dark:text-slate-100 flex items-center justify-center transition-colors duration-300">
      <div className="max-w-2xl w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            AI Mock Interview Setup
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Configure your real-time AI-guided practice session</p>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i <= step ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-slate-200 dark:bg-slate-800'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-xl dark:shadow-2xl transition-colors"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{steps[step].title}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{steps[step].subtitle}</p>

            {step === 0 && (
              <div className="space-y-3">
                {MODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setConfig(p => ({ ...p, mode: m.id }))}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                      config.mode === m.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-600/10 text-indigo-950 dark:text-white shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-950/40'
                    }`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{m.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{m.desc}</div>
                    </div>
                    {config.mode === m.id && <div className="ml-auto w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs">✓</div>}
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {COMPANIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setConfig(p => ({ ...p, company: c.id }))}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      config.company === c.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-600/10 text-indigo-950 dark:text-white shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 dark:text-white">{c.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{c.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div>
                <button
                  onClick={() => setConfig(p => ({ ...p, topic: '' }))}
                  className={`w-full p-3 rounded-xl border mb-3 text-left text-sm transition-all ${
                    !config.topic
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-600/10 text-indigo-950 dark:text-white shadow-md font-medium'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/40'
                  }`}
                >
                  🎲 No preference — dynamic adaptive selection
                </button>
                <div className="grid grid-cols-3 gap-2">
                  {TOPICS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setConfig(p => ({ ...p, topic: t.id }))}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        config.topic === t.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-600/10 text-indigo-950 dark:text-white shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/40'
                      }`}
                    >
                      <div className="text-xl mb-1">{t.icon}</div>
                      <div className="text-xs font-semibold">{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setConfig(p => ({ ...p, difficulty: d.id }))}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        config.difficulty === d.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-600/10 text-indigo-950 dark:text-white shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/40'
                      }`}
                    >
                      <div className="font-semibold text-slate-900 dark:text-white">{d.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{d.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">🎤 Voice Interaction</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">AI speaks & listens via speech recognition</div>
                  </div>
                  <button
                    onClick={() => setConfig(p => ({ ...p, voiceMode: !p.voiceMode }))}
                    className={`w-12 h-6 rounded-full transition-all p-0.5 ${config.voiceMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${config.voiceMode ? 'translate-x-6' : ''}`} />
                  </button>
                </div>

                <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block font-medium">Target Role</label>
                  <input
                    type="text"
                    value={config.targetRole}
                    onChange={e => setConfig(p => ({ ...p, targetRole: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Software Engineer, Full Stack Developer"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/dashboard')}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
              >
                ← {step === 0 ? 'Dashboard' : 'Back'}
              </button>
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={loading}
                  className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {loading ? 'Starting...' : '🚀 Launch Interview'}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
