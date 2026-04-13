/** URL de la page de connexion de la boutique (port 3001 par défaut). */
export function getStorefrontLoginUrl() {
  const base = import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:3001';
  return `${String(base).replace(/\/$/, '')}/connexion`;
}

export function redirectToStorefrontLogin() {
  window.location.replace(getStorefrontLoginUrl());
}
