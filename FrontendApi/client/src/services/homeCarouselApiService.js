import api from './api';

export const getAdminHomeCarousel = () => api.get('/admin/home-carousel');

export const putAdminHomeCarousel = (slides) => api.put('/admin/home-carousel', { slides });
