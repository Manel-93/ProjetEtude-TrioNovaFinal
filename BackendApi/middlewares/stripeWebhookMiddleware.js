import { getStripeWebhookSecret, getStripeClient } from '../config/stripe.js';

// Middleware pour vérifier la signature des webhooks Stripe
export const verifyStripeWebhook = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = getStripeWebhookSecret();

  if (!webhookSecret) {
    return res.status(500).json({
      success: false,
      error: {
        type: 'ConfigurationError',
        message: 'Stripe webhook secret is not configured'
      }
    });
  }

  if (!sig) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: 'Missing stripe-signature header'
      }
    });
  }

  let event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: `Webhook signature verification failed: ${err.message}`
      }
    });
  }

  // Attacher l'événement à la requête pour utilisation dans le contrôleur
  req.stripeEvent = event;
  next();
};

// Middleware pour parser le body brut (requis pour Stripe)
export const rawBodyMiddleware = (req, res, next) => {
  // Express.json() parse déjà le body, mais Stripe a besoin du body brut
  // On doit désactiver le parsing JSON pour cette route spécifique
  // Cette route doit être configurée AVANT express.json() dans server.js
  if (req.originalUrl === '/api/payments/webhook') {
    req.rawBody = req.body;
    return next();
  }
  next();
};

