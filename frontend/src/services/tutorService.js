import api from './api';

export const sendTutorMessage = async (message, history = [], token, context = null) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await api.post(
      '/tutor',
      {
        message,
        history,
        context,
      },
      config
    );

    return response.data.reply;
  } catch (error) {
    throw error.response?.data?.message || error.message || 'Failed to get tutor response';
  }
};
