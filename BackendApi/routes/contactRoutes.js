import express from 'express';
import { ContactMessageController } from '../controllers/contactMessageController.js';
import { ChatbotController } from '../controllers/chatbotController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { createContactMessageSchema } from '../validators/contactMessageValidator.js';

const router = express.Router();
const contactMessageController = new ContactMessageController();
const chatbotController = new ChatbotController();

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Envoyer un message de contact
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jean Dupont
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jean@example.com
 *               subject:
 *                 type: string
 *                 example: Question sur un produit
 *               message:
 *                 type: string
 *                 example: Bonjour, j\'aimerais des informations sur...
 *     responses:
 *       201:
 *         description: Message de contact créé avec succès
 *       400:
 *         description: Erreur de validation
 */
router.post('/contact', validate(createContactMessageSchema), contactMessageController.create);

/**
 * @swagger
 * /chatbot/message:
 *   post:
 *     summary: Envoyer un message au chatbot
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Identifiant de session du chatbot (si déjà existant)
 *               message:
 *                 type: string
 *                 description: Message de l\'utilisateur
 *                 example: Quels sont les délais de livraison ?
 *     responses:
 *       200:
 *         description: Réponse du chatbot
 */
router.post('/chatbot/message', chatbotController.sendMessage);

/**
 * @swagger
 * /admin/messages:
 *   get:
 *     summary: Récupérer les messages de contact (Admin)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, resolved, archived]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Liste des messages de contact
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.get('/admin/messages', authenticate, isAdmin, contactMessageController.getAll);

export default router;

