import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGE_LABELS = {
  WARMUP: '🔥 Warm-Up',
  INTRO: '👋 Introduction',
  RESUME_DISCUSSION: '📄 Resume',
  DSA_ROUND: '💻 Coding',
  SYSTEM_DESIGN: '🏗️ System Design',
  FOLLOW_UP: '🔍 Follow-Up',
  HR_ROUND: '🤝 HR Round',
  FEEDBACK: '📊 Feedback',
  END: '✅ Complete',
};

const STAGE_FLOW = [
  'WARMUP', 'INTRO', 'RESUME_DISCUSSION', 'DSA_ROUND', 'FOLLOW_UP', 'HR_ROUND', 'FEEDBACK', 'END'
];

export default function InterviewSidebar({
  stage,
  elapsedTime,
  questionCount,
  hintsUsed,
  maxHints = 3,
  isClarifying,
  isPaused,
  onRequestHint,
  onNextStage,
  onPause,
  onResume,
}) {
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const stageIndex = STAGE_FLOW.indexOf(stage);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  return (
    <div className="flex flex-col h-full w-64 border-l border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#060610] text-slate-800 dark:text-slate-200 flex-shrink-0 overflow-y-auto scrollbar-thin transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3 font-semibold">Interview Progress</p>
        <div className="space-y-1.5">
          {STAGE_FLOW.slice(0, -1).map((s, i) => {
            const isCompleted = i < stageIndex;
            const isCurrent = s === stage;
            return (
              <div key={s} className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold transition-all
                  ${isCurrent ? 'bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.6)] text-white' :
                    isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-500'}`}
                >
                  {isCompleted ? '✓' : i + 1}
                </div>
                <span className={`text-xs transition-colors ${
                  isCurrent ? 'text-slate-900 dark:text-white font-semibold' :
                  isCompleted ? 'text-emerald-700 dark:text-emerald-400/80' : 'text-slate-500 dark:text-slate-600'
                }`}>
                  {STAGE_LABELS[s]}
                </span>
                {isCurrent && (
                  <motion.div
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center shadow-sm">
          <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">{formatTime(elapsedTime)}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">Elapsed</div>
        </div>
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center shadow-sm">
          <div className="text-lg font-bold text-slate-900 dark:text-white">{questionCount}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">Exchanges</div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 space-y-2">
        <AnimatePresence>
          {isClarifying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
            >
              <span className="text-xs">💬</span>
              <span className="text-xs text-cyan-600 dark:text-cyan-300 font-medium">Clarification mode</span>
            </motion.div>
          )}
          {isPaused && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
            >
              <span className="text-xs">⏸️</span>
              <span className="text-xs text-amber-600 dark:text-amber-300 font-medium">Interview paused</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 space-y-2">
        <button
          onClick={onRequestHint}
          disabled={hintsUsed >= maxHints}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all
            ${hintsUsed < maxHints
              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
              : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
        >
          <span className="flex items-center gap-2 font-medium">
            <span>💡</span>
            <span>Request Hint</span>
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${hintsUsed < maxHints ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold' : 'bg-slate-300 dark:bg-white/5 text-slate-500'}`}>
            {maxHints - hintsUsed}/{maxHints}
          </span>
        </button>

        <button
          onClick={isPaused ? onResume : onPause}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all font-medium
            ${isPaused
              ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/30'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
        >
          <span>{isPaused ? '▶' : '⏸'}</span>
          <span>{isPaused ? 'Resume Interview' : 'Pause'}</span>
        </button>

        <button
          onClick={onNextStage}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all"
        >
          <span>Next Stage →</span>
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col min-h-0">
        <button
          onClick={() => setShowNotes(p => !p)}
          className="flex items-center justify-between w-full mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <span>📝</span> Private Notes
          </span>
          <span>{showNotes ? '▲' : '▼'}</span>
        </button>
        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 160 }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Jot down notes or code thoughts..."
                className="w-full h-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-300 placeholder-slate-400 resize-none focus:outline-none focus:border-indigo-500 transition-colors scrollbar-thin"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
