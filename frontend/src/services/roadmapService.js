import api from './api';

export const generateRoadmap = async (topic) => {
  const { data } = await api.post('/roadmaps', { topic });
  return data;
};

export const getUserRoadmaps = async () => {
  const { data } = await api.get('/roadmaps');
  return data;
};

export const getRoadmapById = async (id) => {
  const { data } = await api.get(`/roadmaps/${id}`);
  return data;
};