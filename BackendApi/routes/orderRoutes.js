import express from 'express';
import { OrderController } from '../controllers/orderController.js';
import { InvoiceController } from '../controllers/invoiceController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { updateOrderStatusSchema } from '../validators/orderValidator.js';

const router = express.Router();
const orderController = new OrderController();
const invoiceController = new InvoiceController();

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Récupérer mes commandes
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des commandes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       orderNumber:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, processing, completed, canceled]
 *                       total:
 *                         type: number
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Non authentifié
 */
router.get('/', authenticate, orderController.getMyOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Récupérer une commande par ID
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la commande
 *     responses:
 *       200:
 *         description: Détails de la commande
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
 *                     id:
 *                       type: integer
 *                     orderNumber:
 *                       type: string
 *                     status:
 *                       type: string
 *                     items:
 *                       type: array
 *                     statusHistory:
 *                       type: array
 *                     invoice:
 *                       type: object
 *       404:
 *         description: Commande introuvable
 *       401:
 *         description: Non authentifié
 */
router.get('/:id', authenticate, orderController.getOrderById);

/**
 * @swagger
 * /orders/admin/orders:
 *   get:
 *     summary: Récupérer toutes les commandes (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, canceled]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
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
 *         description: Liste des commandes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.get('/admin/orders', authenticate, isAdmin, orderController.getAllOrders);
router.get('/admin/orders/:id', authenticate, isAdmin, orderController.getOrderByIdAdmin);

/**
 * @swagger
 * /orders/admin/orders/{id}/status:
 *   post:
 *     summary: Mettre à jour le statut d'une commande (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, completed, canceled]
 *                 example: processing
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Notes optionnelles sur le changement de statut
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Commande introuvable
 */
router.post('/admin/orders/:id/status', authenticate, isAdmin, validate(updateOrderStatusSchema), orderController.updateOrderStatus);

/**
 * @swagger
 * /orders/invoices/{id}/pdf:
 *   get:
 *     summary: Télécharger le PDF d'une facture
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la facture
 *     responses:
 *       200:
 *         description: Fichier PDF de la facture
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Facture introuvable
 *       401:
 *         description: Non authentifié
 */
router.get('/invoices/:id/pdf', authenticate, invoiceController.getInvoicePDF);

export default router;

