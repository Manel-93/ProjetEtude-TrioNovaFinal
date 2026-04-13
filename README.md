# Althea Systems — TrioNova

Plateforme e-commerce (boutique vitrine + API + panneau d’administration). Ce dépôt regroupe le **backend Node.js**, la **boutique React** (Vite) et le **client admin** (Vite).

## Architecture

| Composant | Port dev (défaut) | Rôle |
|-----------|-------------------|------|
| **BackendApi** | `5000` | API REST, auth JWT, MySQL, MongoDB, Stripe, Elasticsearch (optionnel) |
| **FrontendApi/client** | `3000` | Panneau admin (back-office) |
| **FrontendApi/storefront** | `3001` | Site boutique (clients) |

Connexion **administrateur** : depuis la boutique (`/connexion`), après succès l’utilisateur `ADMIN` est redirigé vers `http://localhost:3000/auth/handoff#access=…&refresh=…` (jetons dans le fragment d’URL). Variables utiles :

- Boutique : `VITE_ADMIN_URL` (URL du client admin, ex. `http://localhost:3000`)
- Admin : `VITE_STOREFRONT_URL` (URL de la boutique pour déconnexion / redirection login, ex. `http://localhost:3001`)

## Arborescence du code

```
ProjetEtude-TrioNova-main/
├── BackendApi/                    # API Express
│   ├── config/                    # Bases de données, Elasticsearch…
│   ├── controllers/               # Contrôleurs HTTP
│   ├── middlewares/               # Auth, erreurs, validation…
│   ├── models/                    # Modèles Mongoose (ex. tokens)
│   ├── repositories/              # Accès MySQL / abstraction données
│   ├── routes/                    # Déclaration des routes Express
│   ├── services/                  # Logique métier
│   ├── validators/                # Schémas Joi
│   ├── scripts/                   # Scripts utilitaires
│   ├── invoices/                  # Génération factures PDF (si présent)
│   ├── server.js                  # Point d’entrée
│   ├── package.json
│   └── README.md                  # Détail API, variables .env, Swagger
│
├── FrontendApi/
│   ├── client/                    # Admin Vite + React Router
│   │   ├── public/
│   │   │   └── branding/          # Logos SVG (Althea)
│   │   ├── src/
│   │   │   ├── components/        # UI, layout, graphiques…
│   │   │   ├── context/           # AuthContext admin
│   │   │   ├── pages/             # Écrans (produits, commandes, auth/handoff…)
│   │   │   ├── router/            # createBrowserRouter
│   │   │   ├── services/          # Appels axios (/api)
│   │   │   ├── utils/
│   │   │   ├── App.jsx
│   │   │   ├── index.js
│   │   │   └── index.css
│   │   ├── index.html
│   │   ├── vite.config.js         # port 3000, proxy → :5000
│   │   ├── .env / .env.example
│   │   └── package.json
│   │
│   └── storefront/                # Boutique Vite + React + i18n
│       ├── public/
│       ├── src/
│       │   ├── api/               # Client axios, stockage tokens
│       │   ├── components/      # layout, cart, etc.
│       │   ├── contexts/          # AuthContext boutique
│       │   ├── i18n/              # fr, en, ar
│       │   ├── pages/             # Home, produit, panier, connexion…
│       │   ├── services/
│       │   ├── utils/
│       │   ├── App.jsx
│       │   └── main.jsx
│       ├── index.html
│       ├── vite.config.js         # port 3001, proxy → :5000
│       ├── .env
│       └── package.json
│
└── .gitignore
```

Les dossiers `node_modules/` et `dist/` ne sont pas listés : ils sont générés après `npm install` / `npm run build`.

## Prérequis

- **Node.js** LTS (18+ recommandé)
- **npm**
- **MySQL** (schéma / base du projet)
- **MongoDB** (Atlas ou local) pour refresh tokens et données associées
- **Elasticsearch** (optionnel ; l’API peut fonctionner sans, selon configuration)

## Installation et démarrage (résumé)

### 1. Backend

```bash
cd BackendApi
npm install
```

Créer un fichier **`.env`** à la racine de `BackendApi` (voir **`BackendApi/README.md`** pour la liste complète des variables : MySQL, `MONGODB_URI`, `JWT_SECRET`, Stripe, email, Elasticsearch, etc.). Ne commitez jamais de secrets réels.

```bash
npm run dev
```

L’API écoute par défaut sur **http://localhost:5000**.

### 2. Boutique (storefront)

```bash
cd FrontendApi/storefront
npm install
```

Configurer **`.env`** (exemples) :

- `VITE_PROXY_API=http://localhost:5000` — cible du proxy Vite pour `/api`
- `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_…`
- `VITE_ADMIN_URL=http://localhost:3000`

```bash
npm run dev
```

Ouverture : **http://localhost:3001**

Tests unitaires storefront :

```bash
cd FrontendApi/storefront
npm run test
```

### 3. Panneau admin

```bash
cd FrontendApi/client
npm install
```

Configurer **`.env`** :

- `VITE_PUBLIC_API_ORIGIN=http://localhost:5000` (pour résoudre les URLs médias `/uploads/…` si besoin)
- `VITE_STOREFRONT_URL=http://localhost:3001`

```bash
npm run dev
```

Ouverture : **http://localhost:3000** (accès protégé : connexion admin via la boutique puis `/auth/handoff`).

## Builds production

```bash
# Boutique
cd FrontendApi/storefront && npm run build

# Admin
cd FrontendApi/client && npm run build
```

Servir les dossiers `dist/` derrière un reverse proxy qui redirige `/api` vers le backend.

## Documentation API

Swagger / détails des endpoints : consulter **`BackendApi/README.md`** (après démarrage du serveur, selon configuration du projet).

## Langue de l’interface

- **Boutique** : i18next, langue par défaut **français** (`FrontendApi/storefront/src/i18n`), détection `localStorage` puis navigateur.
- **Admin** : libellés en français dans les composants principaux.
