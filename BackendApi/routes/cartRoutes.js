import express from 'express';
import { CartController } from '../controllers/cartController.js';
import { handleGuestToken } from '../middlewares/cartMiddleware.js';
import { authenticateOptional } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { addItemSchema, updateItemSchema, removeItemSchema } from '../validators/cartValidator.js';

const router = express.Router();
const cartController = new CartController();

// Toutes les routes du panier nécessitent le middleware handleGuestToken
// pour gérer le guest token (même pour les utilisateurs authentifiés)
router.use(authenticateOptional, handleGuestToken);

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Obtenir le panier (utilisateur ou invité)
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *       - guestToken: []
 *     description: |
 *       Récupère le panier de l'utilisateur connecté ou du visiteur invité.
 *       Si un utilisateur est connecté, retourne son panier utilisateur.
 *       Sinon, utilise le guest token fourni dans le header X-Guest-Token.
 *     responses:
 *       200:
 *         description: Panier récupéré avec succès
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
 *                     cart:
 *                       type: object
 *                     items:
 *                       type: array
 *                     subtotal:
 *                       type: number
 *                     tva:
 *                       type: number
 *                     total:
 *                       type: number
 */
router.get('/', cartController.getCart);

/**
 * @swagger
 * /cart/validate:
 *   get:
 *     summary: Valider le panier avant checkout
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *       - guestToken: []
 *     description: |
 *       Vérifie que le panier est valide avant de procéder au paiement.
 *       Vérifie la disponibilité des produits, les stocks, etc.
 *     responses:
 *       200:
 *         description: Panier valide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Panier invalide avec détails des erreurs
 */
router.get('/validate', cartController.validateCart);

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Ajouter un produit au panier
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *       - guestToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: integer
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Produit ajouté au panier avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Erreur de validation ou produit indisponible
 *       404:
 *         description: Produit introuvable
 */
router.post('/add', validate(addItemSchema), cartController.addItem);

/**
 * @swagger
 * /cart/update:
 *   patch:
 *     summary: Mettre à jour la quantité d'un produit dans le panier
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *       - guestToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: integer
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *     responses:
 *       200:
 *         description: Quantité mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Produit introuvable dans le panier
 */
router.patch('/update', validate(updateItemSchema), cartController.updateItem);

/**
 * @swagger
 * /cart/remove:
 *   delete:
 *     summary: Supprimer un produit du panier
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *       - guestToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Produit supprimé du panier avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Produit introuvable dans le panier
 */
router.delete('/remove', validate(removeItemSchema), cartController.removeItem);

export default router;

