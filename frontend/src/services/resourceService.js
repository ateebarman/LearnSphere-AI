import api from './api';

export const getResources = async (topic) => {
  const { data } = await api.get(`/resources/${topic}`);
  return data;
};
