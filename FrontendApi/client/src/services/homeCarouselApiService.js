import api from './api';

export const getAdminHomeCarousel = () => api.get('/admin/home-carousel');

export const putAdminHomeCarousel = (slides) => api.put('/admin/home-carousel', { slides });

export const uploadAdminHomeCarouselImages = (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  return api.post('/admin/home-carousel/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
