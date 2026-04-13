import api from './api';

// userRoutes.js est monté sous `/api/users`
// - GET /api/users/admin/users
// - GET /api/users/admin/users/:id
// - PATCH /api/users/admin/users/:id/status
// - DELETE /api/users/admin/users/:id
export const getUsers = (params = {}) => api.get('/users/admin/users', { params });

export const getUserById = (id) => api.get(`/users/admin/users/${id}`);

export const updateUserStatus = (id, is_active) =>
  api.patch(`/users/admin/users/${id}/status`, { is_active });

export const deleteUser = (id) => api.delete(`/users/admin/users/${id}`);

// adminRoutes.js est monté sous `/api/admin`
// - POST /api/admin/users/:id/reset-password
export const resetUserPassword = (id, payload) =>
  api.post(`/admin/users/${id}/reset-password`, payload);

