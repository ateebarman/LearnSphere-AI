import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SilenceNudge({ phase, message, onDismiss }) {
  return (
    <AnimatePresence>
      {phase !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 w-max max-w-[320px]"
        >
          <div
            className={`
              rounded-2xl px-4 py-3 text-sm text-white shadow-xl
              flex items-start gap-3
              ${phase === 'nudging'
                ? 'bg-indigo-900/80 border border-indigo-500/30 backdrop-blur-lg'
                : 'bg-amber-900/80 border border-amber-500/30 backdrop-blur-lg'
              }
            `}
          >
            <motion.span
              animate={{ rotate: phase === 'nudging' ? [0, 10, -10, 0] : [0] }}
              transition={{ duration: 0.5, repeat: phase === 'nudging' ? Infinity : 0, repeatDelay: 2 }}
              className="text-lg flex-shrink-0"
            >
              {phase === 'nudging' ? '🤔' : '⏭️'}
            </motion.span>
            <div className="flex-1">
              <p className="leading-snug">
                {message || (phase === 'nudging'
                  ? "Take your time — what are you thinking through?"
                  : "No worries! Let's move on to the next question."
                )}
              </p>
            </div>
            {onDismiss && phase === 'nudging' && (
              <button
                onClick={onDismiss}
                className="text-white/40 hover:text-white/80 transition-colors text-xs ml-1 flex-shrink-0 mt-0.5"
                aria-label="Dismiss"
              >
                ✕
              </button>
            )}
          </div>

          <div
            className={`
              absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45
              ${phase === 'nudging'
                ? 'bg-indigo-900/80 border-r border-b border-indigo-500/30'
                : 'bg-amber-900/80 border-r border-b border-amber-500/30'
              }
            `}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
