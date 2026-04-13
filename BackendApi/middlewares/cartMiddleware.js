import { CartService } from '../services/cartService.js';

const cartService = new CartService();

// Middleware pour gérer le guest token
// Génère un token si absent, ou utilise celui fourni dans le header/cookie
export const handleGuestToken = (req, res, next) => {
  // Si l'utilisateur est authentifié, pas besoin de guest token
  if (req.user && req.user.userId) {
    return next();
  }

  // Vérifier si un guest token est fourni dans le header
  let guestToken = req.headers['x-guest-token'] || req.headers['guest-token'];
  
  // Sinon, vérifier dans les cookies
  if (!guestToken && req.cookies && req.cookies.guest_token) {
    guestToken = req.cookies.guest_token;
  }

  // Générer un nouveau token si absent
  if (!guestToken) {
    guestToken = cartService.generateGuestToken();
  }

  // Stocker le token dans la requête pour utilisation ultérieure
  req.guestToken = guestToken;

  // Ajouter le token dans la réponse (header ou cookie)
  // Ici, on le met dans le header pour que le client puisse le lire
  res.setHeader('X-Guest-Token', guestToken);

  next();
};

