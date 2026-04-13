import api from '../api/client';

export function fetchHomeCarousel() {
  return api.get('/home-carousel');
}
