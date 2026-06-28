import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnswerTimerRing({
  totalSeconds,
  isActive,
  onExpire,
  onSubmitEarly,
  onReset,
}) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [hasExpired, setHasExpired] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
    setHasExpired(false);
  }, [totalSeconds, onReset]);

  useEffect(() => {
    if (!isActive || hasExpired || secondsLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setHasExpired(true);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, hasExpired, onExpire]);

  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const progress = secondsLeft / totalSeconds;
  const strokeDashoffset = circ * (1 - progress);

  const pct = progress * 100;
  const strokeColor =
    pct > 50 ? '#6366f1' :
    pct > 25 ? '#f59e0b' :
    '#ef4444';

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  if (totalSeconds === 0) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="relative" style={{ width: 56, height: 56 }}>
            <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
              <circle
                cx="28" cy="28" r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="4"
              />
              <motion.circle
                cx="28" cy="28" r={radius}
                fill="none"
                stroke={strokeColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={strokeDashoffset}
                animate={{ strokeDashoffset, stroke: strokeColor }}
                transition={{ duration: 0.5, ease: 'linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`text-xs font-mono font-bold transition-colors ${
                  pct <= 25 ? 'text-red-400' :
                  pct <= 50 ? 'text-yellow-400' :
                  'text-indigo-300'
                }`}
              >
                {formatTime(secondsLeft)}
              </span>
            </div>

            {pct <= 25 && !hasExpired && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-red-500/40"
                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onSubmitEarly}
            disabled={hasExpired}
            className="text-[10px] px-2.5 py-1 rounded-lg border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-400/50 transition-all disabled:opacity-30 whitespace-nowrap"
          >
            Submit Now ↵
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
