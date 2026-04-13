import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

let stripeClient = null;

export const getStripeClient = () => {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured in environment variables');
    }

    stripeClient = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  return stripeClient;
};

export const getStripeWebhookSecret = () => {
  return process.env.STRIPE_WEBHOOK_SECRET;
};

