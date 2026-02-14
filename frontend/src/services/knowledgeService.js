import api from './api';

export const getKnowledgeNodes = async (category = '') => {
  const { data } = await api.get(`/knowledge${category ? `?category=${category}` : ''}`);
  return data;
};

export const getKnowledgeDetails = async (topic) => {
  const { data } = await api.get(`/knowledge/${encodeURIComponent(topic)}`);
  return data;
};

export const getCategories = async () => {
  const { data } = await api.get('/knowledge/categories');
  return data;
};
