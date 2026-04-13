import api from '../api/client';

export const getCart = () => api.get('/cart');

export const addToCart = (productId, quantity = 1) =>
  api.post('/cart/add', { productId, quantity });

export const updateCartItem = (productId, quantity) =>
  api.patch('/cart/update', { productId, quantity });

export const removeFromCart = (productId) =>
  api.delete('/cart/remove', { data: { productId } });

export const validateCart = () => api.get('/cart/validate');

export const createPaymentIntent = () => api.post('/payments/create-intent');

export const finalizePaymentIntent = (paymentIntentId) =>
  api.post('/payments/finalize-intent', { paymentIntentId });
