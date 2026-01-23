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

export const getPublicRoadmaps = async () => {
  const { data } = await api.get('/roadmaps/public/list');
  return data;
};

export const toggleRoadmapVisibility = async (id) => {
  const { data } = await api.put(`/roadmaps/${id}/visibility`);
  return data;
};

export const cloneRoadmap = async (id) => {
  const { data } = await api.post(`/roadmaps/${id}/clone`);
  return data;
};