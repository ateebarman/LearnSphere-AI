import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGE_COLORS = {
  WARMUP:             { from: '#f59e0b', to: '#f97316', glow: 'rgba(245,158,11,0.4)' },
  INTRO:              { from: '#6366f1', to: '#8b5cf6', glow: 'rgba(99,102,241,0.4)' },
  RESUME_DISCUSSION:  { from: '#06b6d4', to: '#3b82f6', glow: 'rgba(6,182,212,0.4)'  },
  DSA_ROUND:          { from: '#8b5cf6', to: '#ec4899', glow: 'rgba(139,92,246,0.4)' },
  SYSTEM_DESIGN:      { from: '#10b981', to: '#06b6d4', glow: 'rgba(16,185,129,0.4)' },
  FOLLOW_UP:          { from: '#f472b6', to: '#a78bfa', glow: 'rgba(244,114,182,0.4)' },
  HR_ROUND:           { from: '#34d399', to: '#10b981', glow: 'rgba(52,211,153,0.4)'  },
  FEEDBACK:           { from: '#fbbf24', to: '#f59e0b', glow: 'rgba(251,191,36,0.4)'  },
};

const SIZES = {
  sm: { outer: 40, icon: 14 },
  md: { outer: 56, icon: 18 },
  lg: { outer: 72, icon: 24 },
};

export default function AiAvatar({ isTyping, isSpeaking, isListening, stage, size = 'md' }) {
  const colors = STAGE_COLORS[stage] || STAGE_COLORS['INTRO'];
  const dim = SIZES[size];

  const getStatus = () => {
    if (isTyping) return 'thinking';
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    return 'idle';
  };

  const status = getStatus();

  return (
    <div className="relative flex-shrink-0" style={{ width: dim.outer, height: dim.outer }}>
      <AnimatePresence>
        {(isSpeaking || isListening) && (
          <>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'transparent',
                  border: `2px solid ${colors.from}`,
                  boxShadow: `0 0 ${8 + i * 6}px ${colors.glow}`,
                }}
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 1 + (i + 1) * 0.3, opacity: 0 }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <motion.div
        className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
          boxShadow: status !== 'idle' ? `0 0 20px ${colors.glow}` : 'none',
        }}
        animate={
          status === 'speaking' ? { scale: [1, 1.06, 1], rotate: [0, 1, -1, 0] } :
          status === 'thinking' ? { scale: [1, 1.02, 1] } :
          { scale: 1 }
        }
        transition={
          status === 'speaking' ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } :
          status === 'thinking' ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } :
          {}
        }
      >
        <AnimatePresence mode="wait">
          {status === 'thinking' ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, rotate: 360 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ rotate: { duration: 1.5, repeat: Infinity, ease: 'linear' } }}
              style={{ fontSize: dim.icon }}
            >
              ⟳
            </motion.div>
          ) : status === 'speaking' ? (
            <motion.div
              key="speaking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-0.5"
            >
              {[0, 1, 2, 1, 0].map((h, i) => (
                <motion.div
                  key={i}
                  className="rounded-full bg-white/90"
                  style={{ width: dim.outer * 0.055, borderRadius: 2 }}
                  animate={{ height: [dim.icon * (0.4 + h * 0.2), dim.icon, dim.icon * (0.4 + h * 0.2)] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
                />
              ))}
            </motion.div>
          ) : status === 'listening' ? (
            <motion.div
              key="listening"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{ fontSize: dim.icon }}
            >
              👂
            </motion.div>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-bold text-white select-none"
              style={{ fontSize: dim.icon }}
            >
              AI
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
