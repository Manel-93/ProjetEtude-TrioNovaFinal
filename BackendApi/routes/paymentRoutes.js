import express from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { authenticateOptional } from '../middlewares/authMiddleware.js';
import { handleGuestToken } from '../middlewares/cartMiddleware.js';
import { verifyStripeWebhook } from '../middlewares/stripeWebhookMiddleware.js';

const router = express.Router();
const paymentController = new PaymentController();

/**
 * @swagger
 * /payments/create-intent:
 *   post:
 *     summary: Créer un PaymentIntent Stripe pour le panier
 *     tags: [Paiements]
 *     security:
 *       - bearerAuth: []
 *       - guestToken: []
 *     description: |
 *       Crée un PaymentIntent Stripe pour le panier actuel (utilisateur ou invité).
 *       Retourne le client_secret nécessaire pour finaliser le paiement côté client.
 *     responses:
 *       200:
 *         description: PaymentIntent créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     clientSecret:
 *                       type: string
 *                       description: Secret client Stripe pour finaliser le paiement
 *                     paymentIntentId:
 *                       type: string
 *       400:
 *         description: Panier vide ou invalide
 *       401:
 *         description: Non authentifié (pour utilisateurs connectés)
 */
router.post('/create-intent', authenticateOptional, handleGuestToken, paymentController.createPaymentIntent);

/**
 * @swagger
 * /payments/finalize-intent:
 *   post:
 *     summary: Finaliser un PaymentIntent côté serveur (fallback sans webhook)
 *     tags: [Paiements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentIntentId]
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Finalisation effectuée
 */
router.post('/finalize-intent', paymentController.finalizePaymentIntent);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Webhook Stripe pour les événements de paiement
 *     tags: [Paiements]
 *     description: |
 *       Endpoint webhook appelé par Stripe pour notifier les événements de paiement.
 *       Ne nécessite pas d'authentification JWT, mais vérifie la signature Stripe.
 *       Le body doit être brut (raw) pour la vérification de signature.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Événement Stripe (format défini par Stripe)
 *     responses:
 *       200:
 *         description: Webhook traité avec succès
 *       400:
 *         description: Signature invalide ou événement non reconnu
 */
router.post('/webhook', 
  verifyStripeWebhook,
  paymentController.handleWebhook
);

export default router;

