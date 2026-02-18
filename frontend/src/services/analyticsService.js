import api from './api';

export const getAnalytics = async () => {
  const { data } = await api.get('/analytics');
  return data;
};

export const getRoadmapStats = async () => {
  const { data } = await api.get('/analytics/roadmaps');
  return data;
};

export const getQuizStats = async () => {
  const { data } = await api.get('/analytics/quizzes');
  return data;
};

export const getCodingAnalytics = async () => {
  const { data } = await api.get('/coding/analytics');
  return data;
};
