import api from './api';

// Dashboard
export const getAdminStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data;
};

// Problems
export const getAdminProblems = async () => {
  const { data } = await api.get('/admin/problems');
  return data;
};

export const createProblem = async (problemData) => {
  const { data } = await api.post('/admin/problems', problemData);
  return data;
};

export const deleteProblem = async (id) => {
  const { data } = await api.delete(`/admin/problems/${id}`);
  return data;
};

export const aiGenerateProblem = async (topic) => {
  const { data } = await api.post('/admin/problems/ai-generate', { topic });
  return data;
};

export const validateProblem = async (problemData) => {
  const { data } = await api.post('/admin/problems/validate', problemData);
  return data;
};

// Knowledge Base
export const getAdminKnowledge = async () => {
  const { data } = await api.get('/admin/knowledge');
  return data;
};

export const createKnowledge = async (knowledgeData) => {
  const { data } = await api.post('/admin/knowledge', knowledgeData);
  return data;
};

export const aiGenerateKnowledge = async (topic, category) => {
  const { data } = await api.post('/admin/knowledge/ai-generate', { topic, category });
  return data;
};

export const deleteKnowledge = async (id) => {
  const { data } = await api.delete(`/admin/knowledge/${id}`);
  return data;
};

// Roadmaps
export const getAdminRoadmaps = async () => {
  const { data } = await api.get('/admin/roadmaps');
  return data;
};

export const createAdminRoadmap = async (roadmapData) => {
  const { data } = await api.post('/admin/roadmaps', roadmapData);
  return data;
};

export const deleteRoadmap = async (id) => {
  const { data } = await api.delete(`/admin/roadmaps/${id}`);
  return data;
};

export const aiGenerateRoadmap = async (topic, difficulty, targetRole) => {
  const { data } = await api.post('/admin/roadmaps/ai-generate', { topic, difficulty, targetRole });
  return data;
};
