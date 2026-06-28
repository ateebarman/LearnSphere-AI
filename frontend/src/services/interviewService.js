import api from './api';

export const startInterview = async (config) => {
  const response = await api.post('/interview/start', config);
  return response.data;
};

export const getInterviewHistory = async () => {
  const response = await api.get('/interview/history');
  return response.data;
};

export const getInterviewDetails = async (id) => {
  const response = await api.get(`/interview/${id}`);
  return response.data;
};

export const generateProblem = async (id, payload) => {
  const response = await api.post(`/interview/${id}/generate-problem`, payload);
  return response.data;
};

export const completeInterview = async (id, payload) => {
  const response = await api.post(`/interview/${id}/complete`, payload);
  return response.data;
};

export const uploadResume = async (formData) => {
  const response = await api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getResumeData = async () => {
  const response = await api.get('/resume/data');
  return response.data;
};
