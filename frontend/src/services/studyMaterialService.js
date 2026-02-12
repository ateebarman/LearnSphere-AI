import api from './api';

export const uploadMaterial = async (formData) => {
  const { data } = await api.post('/study-materials/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const getMaterials = async () => {
  const { data } = await api.get('/study-materials');
  return data;
};

export const deleteMaterial = async (id) => {
  const { data } = await api.delete(`/study-materials/${id}`);
  return data;
};

export const generateRAGRoadmap = async (topic, materialId) => {
  const { data } = await api.post('/roadmaps/rag', { topic, materialId });
  return data;
};
