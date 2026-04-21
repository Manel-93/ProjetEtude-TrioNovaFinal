import api from './api';

export const getChatbotConversations = (params = {}) => api.get('/admin/chatbot/conversations', { params });

export const getChatbotConversationDetail = (sessionId) =>
  api.get(`/admin/chatbot/conversations/${encodeURIComponent(sessionId)}`);
