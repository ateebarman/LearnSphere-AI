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

const BROWSER_SUPPORTS_STT =
  typeof window !== 'undefined' &&
  !!(window.SpeechRecognition || window.webkitSpeechRecognition);

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
  const [transcriptionMode] = useState(BROWSER_SUPPORTS_STT ? 'browser' : 'whisper');

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(0);
  const streamRef = useRef(null);

  // Whisper-mode refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const whisperIntervalRef = useRef(null);

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

  const startAudioAnalyser = useCallback(async (existingStream = null) => {
    try {
      const stream = existingStream || await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!existingStream) streamRef.current = stream;

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
    if (!mediaRecorderRef.current) {
      // Only stop stream in browser STT mode; Whisper manages its own stream
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // ─── Browser STT (Web Speech API) ────────────────────────────────────────
  useEffect(() => {
    synthRef.current = window.speechSynthesis;

    if (!BROWSER_SUPPORTS_STT) return; // Will use Whisper instead

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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

    // Fix: add 100ms delay to avoid Chrome's InvalidStateError on rapid restart
    recognition.onend = () => {
      if (isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current) {
            try { recognition.start(); } catch (e) {
              console.warn('Failed to restart speech recognition:', e.message);
            }
          }
        }, 100);
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
      // Ignore 'no-speech' errors — they fire when silence is detected
    };

    recognitionRef.current = recognition;
  }, [onTranscript, onInterimTranscript, clearSilenceTimers, startSilenceDetection]);

  // ─── Whisper STT (Groq API via backend) ─────────────────────────────────
  const startWhisperRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Start audio level visualizer with the same stream
      startAudioAnalyser(stream);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start(3000); // collect 3s chunks
      mediaRecorderRef.current = recorder;

      // Send accumulated audio to Whisper every 4 seconds
      whisperIntervalRef.current = setInterval(async () => {
        if (audioChunksRef.current.length === 0 || !isListeningRef.current) return;

        const chunks = [...audioChunksRef.current];
        audioChunksRef.current = [];
        const blob = new Blob(chunks, { type: mimeType });

        // Skip very small blobs (silence)
        if (blob.size < 5000) return;

        try {
          const formData = new FormData();
          formData.append('audio', blob, 'chunk.webm');

          const token = localStorage.getItem('userInfo')
            ? JSON.parse(localStorage.getItem('userInfo'))?.token
            : null;

          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
          });
          const data = await res.json();
          if (data.transcript?.trim()) {
            setConfidenceScore(computeConfidence(data.transcript));
            onTranscript(data.transcript.trim());
            clearSilenceTimers();
            startSilenceDetection();
          }
        } catch (e) {
          console.warn('Whisper transcription error:', e.message);
        }
      }, 4000);

      startSilenceDetection();
    } catch (err) {
      console.warn('Whisper recording failed to start:', err.message);
    }
  }, [startAudioAnalyser, onTranscript, clearSilenceTimers, startSilenceDetection]);

  const stopWhisperRecording = useCallback(() => {
    clearInterval(whisperIntervalRef.current);
    whisperIntervalRef.current = null;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];

    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // ─── Public API ──────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (isListeningRef.current) return;
    isListeningRef.current = true;
    setIsListening(true);

    if (transcriptionMode === 'browser' && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        startAudioAnalyser();
        startSilenceDetection();
      } catch (e) {
        console.warn('Speech recognition start error:', e);
      }
    } else {
      // Whisper mode
      startWhisperRecording();
    }
  }, [transcriptionMode, startAudioAnalyser, startSilenceDetection, startWhisperRecording]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');
    clearSilenceTimers();

    if (transcriptionMode === 'browser') {
      try { recognitionRef.current?.stop(); } catch {}
      stopAudioAnalyser();
    } else {
      stopWhisperRecording();
      stopAudioAnalyser();
    }
  }, [transcriptionMode, stopAudioAnalyser, stopWhisperRecording, clearSilenceTimers]);

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
    transcriptionMode,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    signalVoiceActivity,
  };
}
