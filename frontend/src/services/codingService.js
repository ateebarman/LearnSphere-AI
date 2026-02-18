import api from './api';

export const generateQuestions = async (topic) => {
  const { data } = await api.post('/coding/generate', { topic });
  return data;
};

export const generateAIExtension = async (topic) => {
  const { data } = await api.post('/coding/generate-ai', { topic, count: 5 });
  return data;
};

export const runCode = async (questionId, code, language) => {
  const { data } = await api.post('/coding/run', { questionId, code, language });
  return data;
};

export const submitCode = async (questionId, code, language, topic) => {
  const { data } = await api.post('/coding/submit', { questionId, code, language, topic });
  return data;
};

export const getProblems = async (params) => {
  const { data } = await api.get('/coding/problems', { params });
  return data;
};

export const getProblemBySlug = async (slug) => {
  const { data } = await api.get(`/coding/problems/${slug}`);
  return data;
};

export const getProgress = async (topic) => {
  const { data } = await api.get('/coding/progress', { params: { topic } });
  return data;
};

export const getSubmissions = async (questionId) => {
  const { data } = await api.get(`/coding/submissions/${questionId}`);
  return data;
};
