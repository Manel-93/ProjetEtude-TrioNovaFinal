import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Admin2FAController } from '../controllers/admin2faController.js';
import { DashboardController } from '../controllers/dashboardController.js';
import { ContactMessageController } from '../controllers/contactMessageController.js';
import { AdminController } from '../controllers/adminController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { logAdminActivity } from '../middlewares/adminActivityLogMiddleware.js';
import {
  enable2FASchema,
  resetUserPasswordSchema
} from '../validators/adminValidator.js';
import {
  createContactMessageSchema,
  updateContactMessageStatusSchema
} from '../validators/contactMessageValidator.js';
import { replaceHomeCarouselSchema } from '../validators/homeCarouselValidator.js';
import { HomeCarouselController } from '../controllers/homeCarouselController.js';
import { TopProductController } from '../controllers/topProductController.js';
import { AdminBillingController } from '../controllers/adminBillingController.js';
import { addTopProductSchema, reorderTopProductsSchema } from '../validators/topProductValidator.js';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads', 'home-carousel');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
      cb(null, `carousel-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});
const admin2faController = new Admin2FAController();
const dashboardController = new DashboardController();
const contactMessageController = new ContactMessageController();
const adminController = new AdminController();
const homeCarouselController = new HomeCarouselController();
const topProductController = new TopProductController();
const adminBillingController = new AdminBillingController();

/**
 * @swagger
 * /admin/2fa/status:
 *   get:
 *     summary: Récupérer le statut 2FA de l'administrateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut 2FA
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
 *                     isEnabled:
 *                       type: boolean
 *                     hasSecret:
 *                       type: boolean
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.get('/2fa/status', authenticate, isAdmin, admin2faController.getStatus);

/**
 * @swagger
 * /admin/2fa/generate:
 *   post:
 *     summary: Générer un secret 2FA pour l'administrateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Secret 2FA généré
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
 *                     secret:
 *                       type: string
 *                     qrCode:
 *                       type: string
 *                       description: URL du QR code pour l'authentification
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.post('/2fa/generate', authenticate, isAdmin, logAdminActivity('2FA_GENERATE'), admin2faController.generateSecret);

/**
 * @swagger
 * /admin/2fa/enable:
 *   post:
 *     summary: Activer la 2FA pour l'administrateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 description: Code 2FA à 6 chiffres
 *                 example: '123456'
 *     responses:
 *       200:
 *         description: 2FA activée avec succès
 *       400:
 *         description: Code 2FA invalide
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.post('/2fa/enable', authenticate, isAdmin, validate(enable2FASchema), logAdminActivity('2FA_ENABLE'), admin2faController.enable2FA);

/**
 * @swagger
 * /admin/2fa/disable:
 *   post:
 *     summary: Désactiver la 2FA pour l'administrateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA désactivée avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.post('/2fa/disable', authenticate, isAdmin, logAdminActivity('2FA_DISABLE'), admin2faController.disable2FA);

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Récupérer les statistiques du dashboard admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *           default: month
 *         description: Période pour les statistiques
 *     responses:
 *       200:
 *         description: Statistiques du dashboard
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
 *                     totalRevenue:
 *                       type: number
 *                     totalOrders:
 *                       type: integer
 *                     totalUsers:
 *                       type: integer
 *                     totalProducts:
 *                       type: integer
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.get('/dashboard', authenticate, isAdmin, dashboardController.getDashboard);

/**
 * @swagger
 * /admin/dashboard/revenue:
 *   get:
 *     summary: Récupérer les statistiques de revenus
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *           default: month
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
 *     responses:
 *       200:
 *         description: Statistiques de revenus
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.get('/dashboard/revenue', authenticate, isAdmin, dashboardController.getRevenue);

/**
 * @swagger
 * /admin/dashboard/sales-by-category:
 *   get:
 *     summary: Récupérer les ventes par catégorie
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Ventes par catégorie
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
 *                       categoryName:
 *                         type: string
 *                       totalSales:
 *                         type: number
 *                       orderCount:
 *                         type: integer
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.get('/dashboard/sales-by-category', authenticate, isAdmin, dashboardController.getSalesByCategory);

/**
 * @swagger
 * /admin/dashboard/stock-alerts:
 *   get:
 *     summary: Récupérer les alertes de stock
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Seuil d'alerte de stock
 *     responses:
 *       200:
 *         description: Liste des produits en alerte de stock
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
 *                       name:
 *                         type: string
 *                       stock:
 *                         type: integer
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.get('/dashboard/stock-alerts', authenticate, isAdmin, dashboardController.getStockAlerts);

/**
 * @swagger
 * /admin/contact-messages:
 *   post:
 *     summary: Créer un message de contact (public)
 *     tags: [Admin]
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
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Jean Dupont
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jean@example.com
 *               subject:
 *                 type: string
 *                 maxLength: 200
 *                 example: Question sur un produit
 *               message:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *                 example: Bonjour, j'aimerais des informations sur...
 *     responses:
 *       201:
 *         description: Message de contact créé avec succès
 *       400:
 *         description: Erreur de validation
 */
router.post('/contact-messages', validate(createContactMessageSchema), contactMessageController.create);

/**
 * @swagger
 * /admin/contact-messages:
 *   get:
 *     summary: Récupérer tous les messages de contact (Admin)
 *     tags: [Admin]
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
router.get('/contact-messages', authenticate, isAdmin, contactMessageController.getAll);

/**
 * @swagger
 * /admin/contact-messages/stats:
 *   get:
 *     summary: Récupérer les statistiques des messages de contact (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des messages
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
 *                     total:
 *                       type: integer
 *                     pending:
 *                       type: integer
 *                     inProgress:
 *                       type: integer
 *                     resolved:
 *                       type: integer
 *                     archived:
 *                       type: integer
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.get('/contact-messages/stats', authenticate, isAdmin, contactMessageController.getStats);

/**
 * @swagger
 * /admin/contact-messages/{id}:
 *   get:
 *     summary: Récupérer un message de contact par ID (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails du message
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Message introuvable
 */
router.get('/contact-messages/:id', authenticate, isAdmin, contactMessageController.getById);

/**
 * @swagger
 * /admin/contact-messages/{id}/status:
 *   patch:
 *     summary: Mettre à jour le statut d'un message de contact (Admin)
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
 *                 enum: [pending, in_progress, resolved, archived]
 *                 example: resolved
 *               assignedTo:
 *                 type: integer
 *                 nullable: true
 *                 description: ID de l'admin assigné
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
 *         description: Message introuvable
 */
router.patch('/contact-messages/:id/status', authenticate, isAdmin, validate(updateContactMessageStatusSchema), logAdminActivity('CONTACT_MESSAGE_UPDATE', 'contact_message'), contactMessageController.updateStatus);

/**
 * @swagger
 * /admin/users/{id}/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe d'un utilisateur (Admin)
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
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
 *                 description: Nouveau mot de passe (min 8 caractères, majuscule, minuscule, chiffre, caractère spécial)
 *                 example: NouveauMotDePasse123!
 *               sendEmail:
 *                 type: boolean
 *                 default: true
 *                 description: Envoyer un email à l'utilisateur avec le nouveau mot de passe
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Utilisateur introuvable
 */
router.post('/users/:id/reset-password', authenticate, isAdmin, validate(resetUserPasswordSchema), logAdminActivity('USER_RESET_PASSWORD', 'user'), adminController.resetUserPassword);

/**
 * @swagger
 * /admin/users/{id}/revenue-stats:
 *   get:
 *     summary: Récupérer les statistiques de revenus d'un utilisateur (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year, all]
 *           default: all
 *     responses:
 *       200:
 *         description: Statistiques de revenus de l'utilisateur
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
 *                     totalRevenue:
 *                       type: number
 *                     orderCount:
 *                       type: integer
 *                     averageOrderValue:
 *                       type: number
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Utilisateur introuvable
 */
router.get('/users/:id/revenue-stats', authenticate, isAdmin, adminController.getUserRevenueStats);

/**
 * @swagger
 * /admin/home-carousel:
 *   get:
 *     summary: Liste des diapositives (admin)
 *     tags: [Admin, Carrousel]
 *     security:
 *       - bearerAuth: []
 *   put:
 *     summary: Remplacer tout le carrousel
 *     tags: [Admin, Carrousel]
 *     security:
 *       - bearerAuth: []
 */
router.get('/home-carousel', authenticate, isAdmin, homeCarouselController.getAdminSlides);
router.put(
  '/home-carousel',
  authenticate,
  isAdmin,
  validate(replaceHomeCarouselSchema),
  logAdminActivity('HOME_CAROUSEL_UPDATE', 'home_carousel'),
  homeCarouselController.putAdminSlides
);
router.post(
  '/home-carousel/upload',
  authenticate,
  isAdmin,
  upload.array('images', 20),
  homeCarouselController.uploadImages
);

router.get('/top-products', authenticate, isAdmin, topProductController.getAll);
router.post(
  '/top-products',
  authenticate,
  isAdmin,
  validate(addTopProductSchema),
  logAdminActivity('TOP_PRODUCT_ADD', 'product'),
  topProductController.add
);
router.delete(
  '/top-products/:productId',
  authenticate,
  isAdmin,
  logAdminActivity('TOP_PRODUCT_REMOVE', 'product'),
  topProductController.remove
);
router.put(
  '/top-products/reorder',
  authenticate,
  isAdmin,
  validate(reorderTopProductsSchema),
  logAdminActivity('TOP_PRODUCT_REORDER', 'product'),
  topProductController.reorder
);

router.get('/billing/orders/:id/invoice/pdf', authenticate, isAdmin, adminBillingController.downloadInvoicePdf);
router.post('/billing/orders/:id/invoice/email', authenticate, isAdmin, adminBillingController.sendInvoiceEmail);
router.post('/billing/orders/:id/credit-note', authenticate, isAdmin, adminBillingController.createCreditNote);

export default router;

