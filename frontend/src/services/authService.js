import api from './api';

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const signup = async (name, email, password) => {
  const { data } = await api.post('/auth/signup', { name, email, password });
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};

export const updateProfile = async (profileData) => {
  const { data } = await api.put('/auth/profile', profileData);
  return data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const { data } = await api.put('/auth/change-password', { currentPassword, newPassword });
  return data;
};

export const deleteAccount = async (password) => {
  const { data } = await api.delete('/auth/profile', { data: { password } });
  return data;
};