import api from './api';

export const getChatbotConversations = (params = {}) => api.get('/admin/chatbot/conversations', { params });
