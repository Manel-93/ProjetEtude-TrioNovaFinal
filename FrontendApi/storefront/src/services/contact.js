import api from '../api/client';

export const sendContact = (body) => api.post('/contact', body);

export const sendChatbotMessage = (message, sessionId, options = {}) =>
  api.post('/chatbot/message', { message, sessionId, ...options });
