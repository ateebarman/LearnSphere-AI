import { useEffect, useRef, useState, useCallback } from 'react';

const HEDGING_WORDS = [
  'um', 'uh', 'like', 'you know', 'i think', 'i guess', 'maybe',
  'probably', "i'm not sure", "i don't know", 'sort of', 'kind of',
  'basically', 'literally', 'whatever'
];

function computeConfidence(transcript) {
  const lower = transcript.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 100;

  let hedgeCount = 0;
  HEDGING_WORDS.forEach(hw => {
    const re = new RegExp(`\\b${hw}\\b`, 'g');
    hedgeCount += (lower.match(re) || []).length;
  });

  const hedgeRatio = hedgeCount / words.length;
  return Math.max(10, Math.round(100 - hedgeRatio * 400));
}

export function useVoice({
  onTranscript,
  onInterimTranscript,
  onSilenceNudge,
  onSilenceTimeout,
  silenceNudgeDelay = 12000,
  silenceTimeoutDelay = 30000,
}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidenceScore, setConfidenceScore] = useState(100);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(0);
  const streamRef = useRef(null);

  const lastSpeechTimeRef = useRef(0);
  const silenceNudgeTimerRef = useRef(null);
  const silenceTimeoutTimerRef = useRef(null);
  const nudgeFiredRef = useRef(false);
  const timeoutFiredRef = useRef(false);
  const isListeningRef = useRef(false);

  const clearSilenceTimers = useCallback(() => {
    if (silenceNudgeTimerRef.current) clearTimeout(silenceNudgeTimerRef.current);
    if (silenceTimeoutTimerRef.current) clearTimeout(silenceTimeoutTimerRef.current);
    silenceNudgeTimerRef.current = null;
    silenceTimeoutTimerRef.current = null;
    nudgeFiredRef.current = false;
    timeoutFiredRef.current = false;
  }, []);

  const startSilenceDetection = useCallback(() => {
    clearSilenceTimers();
    lastSpeechTimeRef.current = Date.now();
    nudgeFiredRef.current = false;
    timeoutFiredRef.current = false;

    silenceNudgeTimerRef.current = setTimeout(() => {
      if (!nudgeFiredRef.current && isListeningRef.current) {
        nudgeFiredRef.current = true;
        onSilenceNudge?.();
      }
    }, silenceNudgeDelay);

    silenceTimeoutTimerRef.current = setTimeout(() => {
      if (!timeoutFiredRef.current && isListeningRef.current) {
        timeoutFiredRef.current = true;
        onSilenceTimeout?.();
      }
    }, silenceTimeoutDelay);
  }, [clearSilenceTimers, onSilenceNudge, onSilenceTimeout, silenceNudgeDelay, silenceTimeoutDelay]);

  const startAudioAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(1, avg / 80));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.warn('Microphone access denied:', err);
    }
  }, []);

  const stopAudioAnalyser = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    analyserRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setAudioLevel(0);
  }, []);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final_ = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final_ += text;
        } else {
          interim += text;
        }
      }

      if (interim || final_) {
        lastSpeechTimeRef.current = Date.now();
        clearSilenceTimers();
        startSilenceDetection();
      }

      if (interim) {
        setInterimTranscript(interim);
        setConfidenceScore(computeConfidence(interim));
        onInterimTranscript?.(interim);
      }

      if (final_) {
        setInterimTranscript('');
        if (final_.trim()) {
          setConfidenceScore(computeConfidence(final_));
          onTranscript(final_.trim());
          clearSilenceTimers();
        }
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try { recognition.start(); } catch {}
      } else {
        setIsListening(false);
        setInterimTranscript('');
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognitionRef.current = recognition;
  }, [onTranscript, onInterimTranscript, clearSilenceTimers, startSilenceDetection]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return;
    try {
      recognitionRef.current.start();
      isListeningRef.current = true;
      setIsListening(true);
      startAudioAnalyser();
      startSilenceDetection();
    } catch (e) {}
  }, [startAudioAnalyser, startSilenceDetection]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    isListeningRef.current = false;
    try { recognitionRef.current.stop(); } catch {}
    setIsListening(false);
    setInterimTranscript('');
    stopAudioAnalyser();
    clearSilenceTimers();
  }, [stopAudioAnalyser, clearSilenceTimers]);

  const signalVoiceActivity = useCallback(() => {
    clearSilenceTimers();
    startSilenceDetection();
  }, [clearSilenceTimers, startSilenceDetection]);

  const speak = useCallback((text, onEnd) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const cleanText = text.replace(/[*_`#]/g, '').replace(/\n+/g, '. ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Google US English') ||
      v.name.includes('Microsoft David') ||
      v.name.includes('Alex') ||
      (v.lang === 'en-US' && !v.name.includes('Compact'))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [stopListening, stopSpeaking]);

  return {
    isListening,
    isSpeaking,
    audioLevel,
    interimTranscript,
    confidenceScore,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    signalVoiceActivity,
  };
}
