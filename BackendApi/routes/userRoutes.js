import express from 'express';
import { UserController } from '../controllers/userController.js';
import { AdminController } from '../controllers/adminController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
  updateProfileSchema,
  addressSchema,
  updateAddressSchema,
  paymentMethodSchema,
  updateUserStatusSchema
} from '../validators/userValidator.js';

const router = express.Router();
const userController = new UserController();
const adminController = new AdminController();

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
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
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [USER, ADMIN]
 *                     isEmailConfirmed:
 *                       type: boolean
 *                     isActive:
 *                       type: boolean
 *       401:
 *         description: Non authentifié
 */
router.get('/me', authenticate, userController.getMyProfile);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Mettre à jour le profil de l'utilisateur connecté
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Jean
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Dupont
 *               phone:
 *                 type: string
 *                 pattern: '^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$'
 *                 example: '+33123456789'
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 */
router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateMyProfile);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Supprimer le compte de l'utilisateur connecté
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compte supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Non authentifié
 */
router.delete('/me', authenticate, userController.deleteMyAccount);

/**
 * @swagger
 * /users/me/login-history:
 *   get:
 *     summary: Récupérer l'historique de connexion de l'utilisateur
 *     tags: [Utilisateurs]
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
 *         description: Historique de connexion
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
 *                       ipAddress:
 *                         type: string
 *                       userAgent:
 *                         type: string
 *                       loginAt:
 *                         type: string
 *                         format: date-time
 *                       success:
 *                         type: boolean
 *       401:
 *         description: Non authentifié
 */
router.get('/me/login-history', authenticate, userController.getMyLoginHistory);

/**
 * @swagger
 * /users/me/addresses:
 *   get:
 *     summary: Récupérer toutes les adresses de l'utilisateur
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des adresses
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
 *                       type:
 *                         type: string
 *                         enum: [billing, shipping]
 *                       isDefault:
 *                         type: boolean
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       addressLine1:
 *                         type: string
 *                       city:
 *                         type: string
 *                       postalCode:
 *                         type: string
 *                       country:
 *                         type: string
 *       401:
 *         description: Non authentifié
 */
router.get('/me/addresses', authenticate, userController.getMyAddresses);

/**
 * @swagger
 * /users/me/addresses:
 *   post:
 *     summary: Créer une nouvelle adresse
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - firstName
 *               - lastName
 *               - addressLine1
 *               - city
 *               - postalCode
 *               - country
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [billing, shipping]
 *                 example: shipping
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Jean
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Dupont
 *               company:
 *                 type: string
 *                 maxLength: 100
 *                 example: Ma Société
 *               addressLine1:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 example: 123 Rue de la Paix
 *               addressLine2:
 *                 type: string
 *                 maxLength: 200
 *                 example: Appartement 4B
 *               city:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Paris
 *               postalCode:
 *                 type: string
 *                 pattern: '^[0-9A-Z\\s-]{3,10}$'
 *                 example: '75001'
 *               country:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: France
 *               phone:
 *                 type: string
 *                 pattern: '^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$'
 *                 example: '+33123456789'
 *     responses:
 *       201:
 *         description: Adresse créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 */
router.post('/me/addresses', authenticate, validate(addressSchema), userController.createAddress);

/**
 * @swagger
 * /users/me/addresses/{id}:
 *   patch:
 *     summary: Mettre à jour une adresse
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'adresse
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               company:
 *                 type: string
 *                 maxLength: 100
 *               addressLine1:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *               addressLine2:
 *                 type: string
 *                 maxLength: 200
 *               city:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               postalCode:
 *                 type: string
 *                 pattern: '^[0-9A-Z\\s-]{3,10}$'
 *               country:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               phone:
 *                 type: string
 *                 pattern: '^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$'
 *     responses:
 *       200:
 *         description: Adresse mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Adresse introuvable
 */
router.patch('/me/addresses/:id', authenticate, validate(updateAddressSchema), userController.updateAddress);

/**
 * @swagger
 * /users/me/addresses/{id}/default:
 *   patch:
 *     summary: Définir une adresse comme adresse par défaut
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'adresse
 *     responses:
 *       200:
 *         description: Adresse définie comme adresse par défaut
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Adresse introuvable
 */
router.patch('/me/addresses/:id/default', authenticate, userController.setDefaultAddress);

/**
 * @swagger
 * /users/me/addresses/{id}:
 *   delete:
 *     summary: Supprimer une adresse
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'adresse
 *     responses:
 *       200:
 *         description: Adresse supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Adresse introuvable
 */
router.delete('/me/addresses/:id', authenticate, userController.deleteAddress);

/**
 * @swagger
 * /users/me/payment-methods:
 *   get:
 *     summary: Récupérer toutes les méthodes de paiement de l'utilisateur
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des méthodes de paiement
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
 *                       type:
 *                         type: string
 *                         enum: [card, bank_account]
 *                       isDefault:
 *                         type: boolean
 *                       last4:
 *                         type: string
 *                       brand:
 *                         type: string
 *                       expiryMonth:
 *                         type: integer
 *                       expiryYear:
 *                         type: integer
 *       401:
 *         description: Non authentifié
 */
router.get('/me/payment-methods', authenticate, userController.getMyPaymentMethods);

/**
 * @swagger
 * /users/me/payment-methods:
 *   post:
 *     summary: Ajouter une méthode de paiement
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stripeCustomerId
 *               - stripePaymentMethodId
 *             properties:
 *               stripeCustomerId:
 *                 type: string
 *                 example: cus_1234567890
 *               stripePaymentMethodId:
 *                 type: string
 *                 example: pm_1234567890
 *               type:
 *                 type: string
 *                 enum: [card, bank_account]
 *                 default: card
 *               last4:
 *                 type: string
 *                 length: 4
 *                 example: '4242'
 *               brand:
 *                 type: string
 *                 example: visa
 *               expiryMonth:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 12
 *               expiryYear:
 *                 type: integer
 *                 example: 2025
 *     responses:
 *       201:
 *         description: Méthode de paiement ajoutée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 */
router.post('/me/payment-methods', authenticate, validate(paymentMethodSchema), userController.createPaymentMethod);

/**
 * @swagger
 * /users/me/payment-methods/{id}/default:
 *   patch:
 *     summary: Définir une méthode de paiement comme méthode par défaut
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la méthode de paiement
 *     responses:
 *       200:
 *         description: Méthode de paiement définie comme méthode par défaut
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Méthode de paiement introuvable
 */
router.patch('/me/payment-methods/:id/default', authenticate, userController.setDefaultPaymentMethod);

/**
 * @swagger
 * /users/me/payment-methods/{id}:
 *   delete:
 *     summary: Supprimer une méthode de paiement
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la méthode de paiement
 *     responses:
 *       200:
 *         description: Méthode de paiement supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Méthode de paiement introuvable
 */
router.delete('/me/payment-methods/:id', authenticate, userController.deletePaymentMethod);

/**
 * @swagger
 * /users/admin/users:
 *   get:
 *     summary: Récupérer tous les utilisateurs (Admin)
 *     tags: [Admin]
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
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, ADMIN]
 *         description: Filtrer par rôle
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut actif/inactif
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
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
router.get('/admin/users', authenticate, isAdmin, adminController.getAllUsers);

/**
 * @swagger
 * /users/admin/users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par ID (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Utilisateur introuvable
 */
router.get('/admin/users/:id', authenticate, isAdmin, adminController.getUserById);

/**
 * @swagger
 * /users/admin/users/{id}/status:
 *   patch:
 *     summary: Mettre à jour le statut d'un utilisateur (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Utilisateur introuvable
 */
router.patch('/admin/users/:id/status', authenticate, isAdmin, validate(updateUserStatusSchema), adminController.updateUserStatus);

/**
 * @swagger
 * /users/admin/users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Utilisateur introuvable
 */
router.delete('/admin/users/:id', authenticate, isAdmin, adminController.deleteUser);

export default router;

