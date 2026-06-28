import { create } from 'zustand';

export const useInterviewStore = create((set) => ({
  interviewId: null,
  mode: 'mock',
  company: 'generic',
  role: 'Software Engineer',
  topic: '',
  difficulty: 'adaptive',
  stage: 'WARMUP',
  voiceMode: true,
  messages: [],
  isTyping: false,
  evaluation: null,
  codingProblem: null,
  setInterview: (config) => set((state) => ({ ...state, ...config })),
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, timestamp: Date.now() }]
  })),
  appendToLastMessage: (content) => set((state) => {
    const msgs = [...state.messages];
    if (msgs.length && msgs[msgs.length - 1].role === 'assistant') {
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + content };
    } else {
      msgs.push({ role: 'assistant', content, timestamp: Date.now() });
    }
    return { messages: msgs };
  }),
  setTyping: (val) => set({ isTyping: val }),
  setStage: (stage) => set({ stage }),
  setEvaluation: (eval_) => set({ evaluation: eval_ }),
  setCodingProblem: (problem) => set({ codingProblem: problem }),
  resetInterview: () => set({
    interviewId: null, messages: [], stage: 'WARMUP', evaluation: null,
    codingProblem: null, isTyping: false,
  }),
}));
