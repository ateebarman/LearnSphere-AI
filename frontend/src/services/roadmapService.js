import api from './api';

export const getUserRoadmaps = async () => {
    const { data } = await api.get('/roadmaps');
    return data;
};

export const getRoadmapById = async (id) => {
    const { data } = await api.get(`/roadmaps/${id}`);
    return data;
};

export const getRoadmapPreview = async (topic, difficulty, targetRole) => {
    const { data } = await api.post('/roadmaps/preview', { topic, difficulty, targetRole });
    return data;
};

export const createRoadmap = async (roadmapData) => {
    const { data } = await api.post('/roadmaps', roadmapData);
    return data;
};

export const generateRoadmap = async (topic) => {
    const { data } = await api.post('/roadmaps/direct', { topic });
    return data;
};

export const updateRoadmap = async (id, roadmapData) => {
    const { data } = await api.put(`/roadmaps/${id}`, roadmapData);
    return data;
};

export const deleteRoadmap = async (id) => {
    const { data } = await api.delete(`/roadmaps/${id}`);
    return data;
};

export const cloneRoadmap = async (id) => {
    const { data } = await api.post(`/roadmaps/${id}/clone`);
    return data;
};

export const toggleRoadmapVisibility = async (id) => {
    const { data } = await api.put(`/roadmaps/${id}/visibility`);
    return data;
};

export const getPublicRoadmaps = async () => {
    const { data } = await api.get('/roadmaps/public/list');
    return data;
};