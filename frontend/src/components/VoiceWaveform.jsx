import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceWaveform({
  audioLevel,
  isListening,
  interimTranscript = '',
  barCount = 24,
}) {
  const barsRef = useRef(Array(barCount).fill(0.1));

  useEffect(() => {
    if (isListening && audioLevel > 0) {
      barsRef.current = [
        ...barsRef.current.slice(1),
        Math.max(0.05, audioLevel + (Math.random() - 0.5) * 0.15),
      ];
    } else if (!isListening) {
      barsRef.current = Array(barCount).fill(0.05);
    }
  }, [audioLevel, isListening, barCount]);

  const bars = barsRef.current;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="flex items-center justify-center gap-0.5 h-10 w-full max-w-[240px]">
        <AnimatePresence>
          {bars.map((level, i) => (
            <motion.div
              key={i}
              className="rounded-full flex-shrink-0"
              style={{
                width: 3,
                background: isListening
                  ? `hsl(${240 + level * 60}, 80%, ${50 + level * 30}%)`
                  : 'rgba(255,255,255,0.1)',
              }}
              animate={{
                height: isListening
                  ? `${Math.max(4, level * 40)}px`
                  : '4px',
                opacity: isListening ? 0.7 + level * 0.3 : 0.2,
              }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {interimTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-indigo-300/80 italic text-center max-w-[280px] leading-relaxed truncate"
          >
            "{interimTranscript}"
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
