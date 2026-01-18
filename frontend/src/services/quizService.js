import api from './api';

export const generateQuiz = async (moduleTitle, topic) => {
  const { data } = await api.post('/quizzes/generate', { moduleTitle, topic });
  return data;
};

export const submitQuiz = async (roadmapId, moduleTitle, answers, questions) => {
  const { data } = await api.post('/quizzes/submit', {
    roadmapId,
    moduleTitle,
    answers,
    questions
  });
  return data;
};