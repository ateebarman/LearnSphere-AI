import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getInterviewHistory } from '../services/interviewService';

const RECOMMENDATION_CONFIG = {
  'Strong Hire': { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: '🏆' },
  'Hire': { color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30', icon: '✅' },
  'No Hire': { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: '⚠️' },
  'Strong No Hire': { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', icon: '❌' },
};

const MODE_LABELS = {
  mock: '🎯 Full Mock',
  technical: '💻 Technical',
  behavioral: '🤝 Behavioral',
  coding: '⌨️ Coding',
  resume: '📄 Resume',
};

const COMPANY_COLORS = {
  google: 'from-blue-500 to-green-500',
  amazon: 'from-orange-500 to-yellow-500',
  microsoft: 'from-blue-600 to-cyan-500',
  meta: 'from-blue-500 to-purple-500',
  startup: 'from-pink-500 to-rose-500',
  generic: 'from-indigo-600 to-purple-600',
};

function ScoreDonut({ score }) {
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const dash = ((score || 0) / 10) * circ;
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(150,150,150,0.15)" strokeWidth="5" />
        <motion.circle
          cx="28" cy="28" r={radius} fill="none"
          stroke="#818cf8" strokeWidth="5"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-900 dark:text-white">{score || '–'}</span>
      </div>
    </div>
  );
}

export default function MockInterviewHistory() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInterviewHistory()
      .then(data => {
        if (data.success) setInterviews(data.interviews);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Interview History</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{interviews.length} session{interviews.length !== 1 ? 's' : ''} recorded</p>
          </div>
          <button
            onClick={() => navigate('/mock-interview')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/30 text-sm"
          >
            + New Session
          </button>
        </div>

        {interviews.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <div className="text-5xl mb-4">🎤</div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Sessions Yet</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Your interview history will appear here after your first completed session.</p>
            <button
              onClick={() => navigate('/mock-interview')}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors text-sm shadow-md"
            >
              Start Your First Interview
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview, i) => {
              const rec = interview.evaluation?.hiringRecommendation
                ? RECOMMENDATION_CONFIG[interview.evaluation.hiringRecommendation]
                : null;
              const gradient = COMPANY_COLORS[interview.company] || COMPANY_COLORS.generic;

              return (
                <motion.div
                  key={interview._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md dark:hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Company Badge */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md`}>
                      {interview.company === 'generic' ? 'AI' : interview.company.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                            {interview.company === 'generic' ? 'Standard' : interview.company.charAt(0).toUpperCase() + interview.company.slice(1)} Interview
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{interview.targetRole}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                            {MODE_LABELS[interview.mode] || interview.mode}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        {/* Score */}
                        <ScoreDonut score={interview.evaluation?.overallScore} />

                        <div className="flex-1 space-y-1">
                          {rec && (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${rec.bg} ${rec.color}`}>
                              <span>{rec.icon}</span>
                              <span>{interview.evaluation.hiringRecommendation}</span>
                            </span>
                          )}
                          {!rec && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                              {interview.status === 'COMPLETED' ? '✓ Completed' : interview.status === 'ONGOING' ? '⏳ In Progress' : interview.status}
                            </span>
                          )}
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {new Date(interview.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {interview.evaluation?.summary && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">{interview.evaluation.summary}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {interview.evaluation && (
                      <button
                        onClick={() => navigate(`/mock-interview/results/${interview._id}`)}
                        className="flex-1 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl transition-colors border border-indigo-200 dark:border-indigo-500/30"
                      >
                        View Full Report
                      </button>
                    )}
                    <button
                      onClick={() => navigate('/mock-interview')}
                      className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      New Session
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
