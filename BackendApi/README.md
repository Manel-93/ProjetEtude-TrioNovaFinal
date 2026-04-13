# TrioNova Backend API

API Backend REST pour la refonte de la plateforme e-commerce AltheSystems

## Guide d'installation

### Prérequis
- Node.js
- MySQL (phpmyadmin) 
- MongoDB Atlas (cluster voir lien dans le fichier .env)
- npm 

### Étapes d'installation

#### a. Cloner le projet et installer les dépendances
```bash
npm install
```

#### b. Configurer les variables d'environnement
Créer un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=""
DB_NAME=trio_nova_db

MONGODB_URI=mongodb+srv://sterenngougeon_db_user:rqlTLsE2HUV87P6q@cluster0.0mkb2aa.mongodb.net/?appName=Cluster0

JWT_SECRET=votre_secret_jwt_super_securise
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_EMAIL_CONFIRM_EXPIRES_IN=24h
JWT_PASSWORD_RESET_EXPIRES_IN=1h

EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=8c4af8d35e888f
EMAIL_PASSWORD=5af72577da5741
EMAIL_FROM=noreply@trionova.com

PORT=5000

# Elasticsearch Configuration (optionnel)
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX=products
ELASTICSEARCH_USERNAME=  # Optionnel (si authentification requise)
ELASTICSEARCH_PASSWORD=  # Optionnel (si authentification requise)
ALLOW_NO_ELASTICSEARCH=true  # Permet de continuer sans Elasticsearch en développement

# Stripe Configuration (paiements)
STRIPE_SECRET_KEY=sk_test_...  # Clé secrète Stripe (récupérer depuis https://dashboard.stripe.com)
STRIPE_WEBHOOK_SECRET=whsec_...  # Secret webhook Stripe (récupérer depuis Dashboard → Webhooks)
```

#### c. Configurer les bases de données

**MySQL :**
```sql
CREATE DATABASE trio_nova_db;
```

**MongoDB Atlas:**
- Créer un cluster sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Créer un utilisateur avec les permissions nécessaires
- Ajouter votre IP dans la whitelist (Network Access)
- Copier l'URI de connexion et l'ajouter dans `.env` :

  ```
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trio_nova_db?retryWrites=true&w=majority
  ```

**Installer Elasticsearch** (local ou cloud) :
   ```bash
   # Option 1: Docker
   docker run -d --name elasticsearch -p 9200:9200 -e "discovery.type=single-node" elasticsearch:8.11.0
   
   # Option 2: Télécharger depuis https://www.elastic.co/downloads/elasticsearch
   ```

**Configurer les variables d'environnement** dans `.env` :
   ```env
   ELASTICSEARCH_NODE=http://localhost:9200
   ELASTICSEARCH_INDEX=products
   ALLOW_NO_ELASTICSEARCH=true  # Permet de continuer sans Elasticsearch
   ```


#### d. Démarrer le serveur

**Mode développement :**
```bash
npm run dev
```

**Mode production :**
```bash
npm start
```

## Tests côté frontend storefront

Les tests unitaires de pages sont dans `FrontendApi/storefront` (Vitest).

```bash
cd ../FrontendApi/storefront
npm run test
```

Le fichier principal ajouté est `src/pages/pages.smoke.test.jsx` avec 1 test par page.

## Documentation API


La documentation interactive de l'API est disponible via Swagger UI :

**URL** : `http://localhost:5000/api/docs`

Cette interface permet d'xplorer tous les endpoints de l'API

**JSON Swagger** : `http://localhost:5000/api/docs.json`

# Résumé des lignes de commande : 
 
npm install react-router-dom
npm install @reduxjs/toolkit react-redux
npm install i18next react-i18next
npm install axios
npm install express cors dotenv
npm install jsonwebtoken bcrypt
npm install mssql
npm install mongoose
npm install stripe
npm install pdfkit
npm install elasticsearch
npm install -D nodemon


npm create vite@latest althea-front -- --template react
npm install
npm run dev
npm install react-router-dom
npm install @reduxjs/toolkit react-redux
npm install i18next react-i18next
npm install axios

npm install stripe

npm install pdfkit

npm run test



### Routes API - Collection Postman


### Routes Authentification
- POST /auth/register
- POST /auth/confirm-email
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password
- PATCH /auth/change-password

### Routes Utilisateurs (Authentifié)
- GET /users/me
- PATCH /users/me
- DELETE /users/me
- GET /users/me/login-history
- GET /users/me/addresses
- POST /users/me/addresses
- PATCH /users/me/addresses/:id
- PATCH /users/me/addresses/:id/default
- DELETE /users/me/addresses/:id
- GET /users/me/payment-methods
- POST /users/me/payment-methods
- PATCH /users/me/payment-methods/:id/default
- DELETE /users/me/payment-methods/:id

### Routes Admin (Authentifié + Admin)
- GET /users/admin/users
- GET /users/admin/users/:id
- PATCH /users/admin/users/:id/status
- DELETE /users/admin/users/:id

### Routes Produits (Publiques)
- GET /products (avec pagination, filtres: categoryId, status, search, inStock)
- GET /products/search (recherche avancée Elasticsearch - voir documentation ci-dessous)
- GET /products/:slug

### Routes Carrousel d’accueil (Publique)
- **GET** `/api/home-carousel` — Liste des diapositives **actives**, enrichies pour la vitrine (image, titre, sous-titre, lien).  
  - Chaque entrée peut référencer un `productId` (données produit + image principale MongoDB) ou être entièrement personnalisée (`imageUrl`, `linkUrl`, `title`, `subtitle`).  
  - Les diapositives sans image exploitable sont omises de la réponse.

### Routes Admin — Carrousel d’accueil (Authentifié + rôle Admin)
- **GET** `/api/admin/home-carousel` — Liste complète des diapositives (actives ou non), ordre d’affichage inclus.  
- **PUT** `/api/admin/home-carousel` — Remplacement atomique du carrousel.  
  - Corps JSON : `{ "slides": [ { "productId": number | null, "imageUrl": string, "linkUrl": string, "title": string, "subtitle": string, "active": boolean, "sortOrder": number }, ... ] }`  
  - Maximum 50 diapositives. L’ordre du tableau définit l’ordre d’enregistrement (`sortOrder`).

### Routes Admin Produits (Authentifié + Admin)
- GET /products/admin/products
- GET /products/admin/products/:id
- POST /products/admin/products
- PATCH /products/admin/products/:id
- DELETE /products/admin/products/:id
- POST /products/admin/products/:id/images
- PATCH /products/admin/products/:id/images/:imageId
- PATCH /products/admin/products/:id/images/:imageId/primary
- DELETE /products/admin/products/:id/images/:imageId

### Routes Admin Catégories (Authentifié + Admin)
- GET /products/admin/categories
- GET /products/admin/categories/:id
- POST /products/admin/categories
- PATCH /products/admin/categories/:id
- DELETE /products/admin/categories/:id

### Routes Recherche Elasticsearch (Admin)
- POST /products/admin/search/reindex (réindexer tous les produits)

### Routes Panier (Publiques - Invité ou Utilisateur)
- GET /cart (obtenir le panier)
- GET /cart/validate (valider le stock avant checkout)
- POST /cart/add (ajouter un produit)
- PATCH /cart/update (modifier la quantité d'un produit)
- DELETE /cart/remove (supprimer un produit)

### Routes Paiement Stripe (Publiques)
- POST /payments/create-intent (créer un PaymentIntent - invité ou utilisateur)
- POST /payments/finalize-intent (fallback de finalisation commande sans webhook, utile en dev local)
- POST /payments/webhook (webhook Stripe pour les événements de paiement)

### Routes Commandes (Authentifié)
- GET /orders (récupérer mes commandes)
- GET /orders/:id (récupérer une commande par ID)
- GET /orders/invoices/:id/pdf (télécharger le PDF d'une facture)

### Routes Admin Commandes (Authentifié + Admin)
- GET /orders/admin/orders (récupérer toutes les commandes)
- POST /orders/admin/orders/:id/status (mettre à jour le statut d'une commande)


Le serveur démarre sur `http://localhost:5000`

## Architecture

```
trio-nova-api/
├── config/
│   ├── database.js         # Connexions MySQL et MongoDB
│   ├── elasticsearch.js    # Configuration Elasticsearch
│   ├── stripe.js           # Configuration Stripe (paiements)
│   ├── jwt.js              # Configuration JWT
│   └── email.js            # Configuration email (Nodemailer)
│
├── repositories/
│   ├── userRepository.js          # Accès DB MySQL (users)
│   ├── tokenRepository.js         # Accès DB MongoDB (tokens)
│   ├── loginHistoryRepository.js  # Accès DB MongoDB (historique connexions)
│   ├── addressRepository.js       # Accès DB MySQL (adresses)
│   ├── paymentMethodRepository.js # Accès DB MySQL (méthodes paiement)
│   ├── productRepository.js      # Accès DB MySQL (produits)
│   ├── homeCarouselRepository.js # Accès DB MySQL (carrousel d’accueil)
│   ├── categoryRepository.js      # Accès DB MySQL (catégories)
│   ├── productImageRepository.js # Accès DB MongoDB (images produits)
│   ├── cartRepository.js          # Accès DB MySQL (paniers et items)
│   ├── paymentRepository.js        # Accès DB MySQL (paiements)
│   ├── orderRepository.js         # Accès DB MySQL (commandes)
│   └── invoiceRepository.js        # Accès DB MySQL (factures et avoirs)
│
├── services/
│   ├── authService.js           # Logique métier authentification
│   ├── userService.js           # Logique métier utilisateurs
│   ├── productService.js        # Logique métier produits
│   ├── homeCarouselService.js   # Carrousel d’accueil (vitrine + admin)
│   ├── categoryService.js       # Logique métier catégories
│   ├── cartService.js           # Logique métier panier (sync invité→utilisateur)
│   ├── stripeService.js         # Logique métier paiements Stripe (PaymentIntent, webhooks)
│   ├── orderService.js           # Logique métier commandes
│   ├── invoiceService.js         # Logique métier factures (génération PDF)
│   ├── elasticsearchService.js  # Recherche avancée Elasticsearch
│   ├── jwtService.js            # Génération/vérification JWT
│   ├── passwordService.js       # Hashage et validation mot de passe
│   └── emailService.js          # Envoi emails (confirmation, reset)
│
├── controllers/
│   ├── authController.js          # Contrôleurs authentification
│   ├── userController.js          # Contrôleurs utilisateur
│   ├── adminController.js         # Contrôleurs admin
│   ├── productController.js       # Contrôleurs produits (public)
│   ├── adminProductController.js  # Contrôleurs produits (admin)
│   ├── adminCategoryController.js # Contrôleurs catégories (admin)
│   ├── cartController.js          # Contrôleurs panier (invité + utilisateur)
│   ├── paymentController.js       # Contrôleurs paiements Stripe
│   ├── orderController.js         # Contrôleurs commandes
│   ├── invoiceController.js       # Contrôleurs factures
│   ├── searchController.js        # Contrôleurs recherche (public)
│   ├── adminSearchController.js   # Contrôleurs recherche (admin)
│   └── homeCarouselController.js  # Carrousel d’accueil (public + admin)
│
├── middlewares/
│   ├── authMiddleware.js         # Protection JWT
│   ├── adminMiddleware.js         # Vérification rôle admin
│   ├── cartMiddleware.js          # Gestion guest token pour panier invité
│   ├── stripeWebhookMiddleware.js # Vérification signature webhooks Stripe
│   ├── validationMiddleware.js    # Validation Joi
│   └── errorMiddleware.js         # Gestion centralisée erreurs
│
├── routes/
│   ├── authRoutes.js         # Routes authentification
│   ├── userRoutes.js          # Routes utilisateurs et admin
│   ├── productRoutes.js      # Routes produits et catégories
│   ├── homeCarouselRoutes.js # GET public carrousel d’accueil
│   ├── cartRoutes.js          # Routes panier (invité + utilisateur)
│   ├── paymentRoutes.js       # Routes paiements Stripe
│   └── orderRoutes.js          # Routes commandes et factures
│
├── validators/
│   ├── authValidator.js       # Schémas validation auth
│   ├── userValidator.js      # Schémas validation users
│   ├── productValidator.js   # Schémas validation produits
│   ├── homeCarouselValidator.js # Schémas validation carrousel
│   ├── categoryValidator.js  # Schémas validation catégories
│   ├── cartValidator.js       # Schémas validation panier
│   └── orderValidator.js      # Schémas validation commandes
│
├── models/
│   ├── Token.js              # Modèle Token (MongoDB)
│   ├── LoginHistory.js       # Modèle historique connexions (MongoDB)
│   └── ProductImage.js       # Modèle images produits (MongoDB)
│
├── server.js                 # Point d'entrée Express
└── package.json
```

## Flux de données

Client → Routes → Middlewares (validation/auth) → Controllers → Services → Repositories → Database
                                                                                

- **Routes** : Définition des endpoints et association middlewares
- **Controllers** : Gestion requêtes/réponses HTTP
- **Services** : Logique métier et orchestration
- **Repositories** : Accès aux bases de données 
- **Middlewares** : Validation, authentification, gestion erreurs
- **Validators** : Schémas de validation des données



## Sécurité


1. **Helmet** : Headers de sécurité HTTP (XSS Protection, Content Security Policy, etc.)
2. **Rate Limiting** : 
   - 100 requêtes par IP toutes les 15 minutes (routes générales)
   - 5 tentatives de connexion toutes les 15 minutes (routes d'authentification)
3. **XSS Protection** : Nettoyage automatique des entrées utilisateur (xss-clean)
4. **HTTP Parameter Pollution Protection** : Protection contre les attaques HPP
5. **Validation des données** : Validation stricte avec Joi sur tous les endpoints
6. **Protection SQL Injection** : Utilisation de requêtes paramétrées (mysql2)
7. **JWT Authentication** : Tokens sécurisés avec expiration
8. **CORS** : Configuration des origines autorisées

### Logs

- **Morgan** : Logs HTTP automatiques (format dev en développement, format combined en production)
- **Logs applicatifs** : Logs détaillés dans les services pour le débogage

### Gestion des erreurs

- Gestion centralisée dans `middlewares/errorMiddleware.js`

## Important !

- Les tokens de confirmation email expirent après 24h
- Les tokens de réinitialisation expirent après 1h
- Les access tokens expirent après 15 minutes
- Les refresh tokens expirent après 7 jours
- Le changement de mot de passe invalide tous les refresh tokens (force nouvelle connexion)

