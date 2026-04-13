# Storefront (FrontendApi/storefront)

Boutique client React + Vite.

## Lancer en développement

```bash
npm install
npm run dev
```

Application disponible sur `http://localhost:3001` (selon `vite.config.js`).

## Tests unitaires (Vitest)

Le projet utilise **Vitest** + **Testing Library** pour les tests de pages.

### Commandes

```bash
# Exécution unique
npm run test

# Mode watch
npm run test:watch
```

### Couverture actuellement ajoutée

Fichier: `src/pages/pages.smoke.test.jsx`

- 1 test par page (`src/pages/*.jsx`)
- Vérifie que chaque page se rend sans crash (smoke test)
- Mocks des appels réseau/services et des hooks contexte pour isoler l’UI

Total actuel: **19 tests / 19 pages**.
