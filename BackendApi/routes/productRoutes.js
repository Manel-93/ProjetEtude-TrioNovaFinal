import express from 'express';
import { ProductController } from '../controllers/productController.js';
import { AdminProductController } from '../controllers/adminProductController.js';
import { AdminCategoryController } from '../controllers/adminCategoryController.js';
import { SearchController } from '../controllers/searchController.js';
import { AdminSearchController } from '../controllers/adminSearchController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
  createProductSchema,
  updateProductSchema,
  productImageSchema,
  updateProductImageSchema
} from '../validators/productValidator.js';
import {
  createCategorySchema,
  updateCategorySchema
} from '../validators/categoryValidator.js';

const router = express.Router();
const productController = new ProductController();
const adminProductController = new AdminProductController();
const adminCategoryController = new AdminCategoryController();
const searchController = new SearchController();
const adminSearchController = new AdminSearchController();

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Rechercher des produits
 *     tags: [Produits]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrer par catégorie (slug)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Prix minimum
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Prix maximum
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
 *         description: Résultats de recherche
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
 */
router.get('/search', searchController.search);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Récupérer tous les produits (public)
 *     tags: [Produits]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrer par catégorie (slug)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, draft]
 *         description: Filtrer par statut (admin uniquement)
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
 *         description: Liste des produits
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
 *                       slug:
 *                         type: string
 *                       priceHt:
 *                         type: number
 *                       priceTtc:
 *                         type: number
 *                       stock:
 *                         type: integer
 *                       images:
 *                         type: array
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', productController.getAllProducts);

/**
 * @swagger
 * /products/categories:
 *   get:
 *     summary: Liste des catégories actives (vitrine)
 *     tags: [Produits]
 *     responses:
 *       200:
 *         description: Liste des catégories
 */
router.get('/categories', productController.getPublicCategories);

/**
 * @swagger
 * /products/{slug}:
 *   get:
 *     summary: Récupérer un produit par son slug
 *     tags: [Produits]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug du produit
 *     responses:
 *       200:
 *         description: Détails du produit
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
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     technicalSpecs:
 *                       type: object
 *                     priceHt:
 *                       type: number
 *                     priceTtc:
 *                       type: number
 *                     stock:
 *                       type: integer
 *                     category:
 *                       type: object
 *                     images:
 *                       type: array
 *       404:
 *         description: Produit introuvable
 */
router.get('/:slug', productController.getProductBySlug);

/**
 * @swagger
 * /products/admin/products:
 *   get:
 *     summary: Récupérer tous les produits (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, draft]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
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
 *         description: Liste des produits
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.get('/admin/products', authenticate, isAdmin, adminProductController.getAllProducts);

/**
 * @swagger
 * /products/admin/products/{id}:
 *   get:
 *     summary: Récupérer un produit par ID (Admin)
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
 *         description: Détails du produit
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Produit introuvable
 */
router.get('/admin/products/:id', authenticate, isAdmin, adminProductController.getProductById);

/**
 * @swagger
 * /products/admin/products:
 *   post:
 *     summary: Créer un nouveau produit (Admin)
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
 *               - name
 *               - description
 *               - priceHt
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *               technicalSpecs:
 *                 type: object
 *               priceHt:
 *                 type: number
 *                 minimum: 0
 *               tva:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 20
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               priority:
 *                 type: integer
 *                 default: 0
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *                 default: active
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *               categoryId:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       format: uri
 *                     alt:
 *                       type: string
 *                     order:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Produit créé avec succès
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.post('/admin/products', authenticate, isAdmin, validate(createProductSchema), adminProductController.createProduct);

/**
 * @swagger
 * /products/admin/products/{id}:
 *   patch:
 *     summary: Mettre à jour un produit (Admin)
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *               technicalSpecs:
 *                 type: object
 *               priceHt:
 *                 type: number
 *                 minimum: 0
 *               tva:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *               priority:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *               categoryId:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Produit mis à jour avec succès
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Produit introuvable
 */
router.patch('/admin/products/:id', authenticate, isAdmin, validate(updateProductSchema), adminProductController.updateProduct);

/**
 * @swagger
 * /products/admin/products/{id}:
 *   delete:
 *     summary: Supprimer un produit (Admin)
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
 *         description: Produit supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Produit introuvable
 */
router.delete('/admin/products/:id', authenticate, isAdmin, adminProductController.deleteProduct);

/**
 * @swagger
 * /products/admin/products/{id}/images:
 *   post:
 *     summary: Ajouter une image à un produit (Admin)
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
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               alt:
 *                 type: string
 *                 maxLength: 200
 *               order:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Image ajoutée avec succès
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Produit introuvable
 */
router.post('/admin/products/:id/images', authenticate, isAdmin, validate(productImageSchema), adminProductController.addProductImage);

/**
 * @swagger
 * /products/admin/products/{id}/images/{imageId}:
 *   patch:
 *     summary: Mettre à jour une image de produit (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               alt:
 *                 type: string
 *                 maxLength: 200
 *               order:
 *                 type: integer
 *                 minimum: 0
 *               isPrimary:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Image mise à jour avec succès
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Produit ou image introuvable
 */
router.patch('/admin/products/:id/images/:imageId', authenticate, isAdmin, validate(updateProductImageSchema), adminProductController.updateProductImage);

/**
 * @swagger
 * /products/admin/products/{id}/images/{imageId}/primary:
 *   patch:
 *     summary: Définir une image comme image principale (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image définie comme principale
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Produit ou image introuvable
 */
router.patch('/admin/products/:id/images/:imageId/primary', authenticate, isAdmin, adminProductController.setPrimaryImage);

/**
 * @swagger
 * /products/admin/products/{id}/images/{imageId}:
 *   delete:
 *     summary: Supprimer une image de produit (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image supprimée avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Produit ou image introuvable
 */
router.delete('/admin/products/:id/images/:imageId', authenticate, isAdmin, adminProductController.deleteProductImage);

/**
 * @swagger
 * /products/admin/categories:
 *   get:
 *     summary: Récupérer toutes les catégories (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Liste des catégories
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.get('/admin/categories', authenticate, isAdmin, adminCategoryController.getAllCategories);

/**
 * @swagger
 * /products/admin/categories/{id}:
 *   get:
 *     summary: Récupérer une catégorie par ID (Admin)
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
 *         description: Détails de la catégorie
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Catégorie introuvable
 */
router.get('/admin/categories/:id', authenticate, isAdmin, adminCategoryController.getCategoryById);

/**
 * @swagger
 * /products/admin/categories:
 *   post:
 *     summary: Créer une nouvelle catégorie (Admin)
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
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               parentId:
 *                 type: integer
 *                 nullable: true
 *               displayOrder:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *     responses:
 *       201:
 *         description: Catégorie créée avec succès
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.post('/admin/categories', authenticate, isAdmin, validate(createCategorySchema), adminCategoryController.createCategory);

/**
 * @swagger
 * /products/admin/categories/{id}:
 *   patch:
 *     summary: Mettre à jour une catégorie (Admin)
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               parentId:
 *                 type: integer
 *                 nullable: true
 *               displayOrder:
 *                 type: integer
 *                 minimum: 0
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *     responses:
 *       200:
 *         description: Catégorie mise à jour avec succès
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Catégorie introuvable
 */
router.patch('/admin/categories/:id', authenticate, isAdmin, validate(updateCategorySchema), adminCategoryController.updateCategory);

/**
 * @swagger
 * /products/admin/categories/{id}:
 *   delete:
 *     summary: Supprimer une catégorie (Admin)
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
 *         description: Catégorie supprimée avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Catégorie introuvable
 */
router.delete('/admin/categories/:id', authenticate, isAdmin, adminCategoryController.deleteCategory);

/**
 * @swagger
 * /products/admin/search/reindex:
 *   post:
 *     summary: Réindexer tous les produits dans Elasticsearch (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Réindexation démarrée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.post('/admin/search/reindex', authenticate, isAdmin, adminSearchController.reindexAll);

export default router;

