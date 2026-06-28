import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useInterviewStore } from '../store/useInterviewStore';

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '');
    socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
  }
  return socketInstance;
}

export function useInterviewSocket(interviewId, callbacks = {}) {
  const socket = useRef(null);
  const {
    addMessage, appendToLastMessage, setTyping,
    setStage, setEvaluation, setInterview
  } = useInterviewStore();

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const joinInterview = useCallback((config) => {
    if (!interviewId || !socket.current) return;
    socket.current.emit('interview:join', { interviewId, ...config });
  }, [interviewId]);

  const sendMessage = useCallback((content, isSilenceAutoSubmit = false) => {
    if (!interviewId || !socket.current) return;
    if (!isSilenceAutoSubmit) {
      addMessage({ role: 'user', content });
    }
    socket.current.emit('interview:message', { interviewId, content, isSilenceAutoSubmit });
  }, [interviewId, addMessage]);

  const silenceAutoSubmit = useCallback(() => {
    if (!interviewId || !socket.current) return;
    socket.current.emit('interview:silence_auto_submit', { interviewId });
  }, [interviewId]);

  const signalVoiceActivity = useCallback(() => {
    if (!interviewId || !socket.current) return;
    socket.current.emit('interview:voice_activity', { interviewId });
  }, [interviewId]);

  const requestHint = useCallback(() => {
    if (!interviewId || !socket.current) return;
    socket.current.emit('interview:hint', { interviewId });
  }, [interviewId]);

  const nextStage = useCallback(() => {
    if (!interviewId || !socket.current) return;
    socket.current.emit('interview:next_stage', { interviewId });
  }, [interviewId]);

  const pauseInterview = useCallback(() => {
    if (!interviewId || !socket.current) return;
    socket.current.emit('interview:pause', { interviewId });
  }, [interviewId]);

  const resumeInterview = useCallback(() => {
    if (!interviewId || !socket.current) return;
    socket.current.emit('interview:resume', { interviewId });
  }, [interviewId]);

  const sendCodeResult = useCallback((data) => {
    if (!interviewId || !socket.current) return;
    socket.current.emit('code:result', { interviewId, ...data });
  }, [interviewId]);

  useEffect(() => {
    socket.current = getSocket();
    const s = socket.current;

    s.on('interview:ai_chunk', ({ content }) => appendToLastMessage(content));
    s.on('interview:ai_done', () => {});
    s.on('interview:typing', (val) => setTyping(val));
    s.on('interview:stage_changed', ({ stage, timerSeconds }) => {
      setStage(stage);
      callbacksRef.current.onTimerConfig?.(timerSeconds ?? 0);
    });
    s.on('interview:state', ({ stage, timerSeconds, transcript }) => {
      setStage(stage);
      if (transcript && Array.isArray(transcript) && transcript.length > 0) {
        setInterview({ messages: transcript });
      }
      callbacksRef.current.onTimerConfig?.(timerSeconds ?? 0);
    });
    s.on('interview:evaluation', (eval_) => setEvaluation(eval_));

    s.on('interview:silence_nudge', ({ message }) => {
      callbacksRef.current.onSilenceNudge?.(message);
    });
    s.on('interview:silence_timeout', ({ message }) => {
      callbacksRef.current.onSilenceTimeout?.(message);
    });
    s.on('interview:clarification_mode', ({ active }) => {
      callbacksRef.current.onClarificationMode?.(active);
    });
    s.on('interview:hint_count', ({ hintsUsed }) => {
      callbacksRef.current.onHintCount?.(hintsUsed);
    });
    s.on('interview:paused', () => callbacksRef.current.onPaused?.());
    s.on('interview:resumed', () => callbacksRef.current.onResumed?.());

    return () => {
      s.off('interview:ai_chunk');
      s.off('interview:ai_done');
      s.off('interview:typing');
      s.off('interview:stage_changed');
      s.off('interview:state');
      s.off('interview:evaluation');
      s.off('interview:silence_nudge');
      s.off('interview:silence_timeout');
      s.off('interview:clarification_mode');
      s.off('interview:hint_count');
      s.off('interview:paused');
      s.off('interview:resumed');
    };
  }, [appendToLastMessage, setTyping, setStage, setEvaluation, setInterview]);

  return {
    joinInterview,
    sendMessage,
    silenceAutoSubmit,
    signalVoiceActivity,
    requestHint,
    nextStage,
    pauseInterview,
    resumeInterview,
    sendCodeResult,
  };
}
