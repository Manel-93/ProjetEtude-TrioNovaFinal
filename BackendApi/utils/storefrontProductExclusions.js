/**
 * Produits masqués sur la vitrine (liste, fiche, recherche, carrousel).
 * L’admin continue de voir tous les produits en base.
 */

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function isProductExcludedFromStorefront(product) {
  const n = normalizeName(product?.name);
  if (!n) return false;
  if (n.includes('chaise roulante') || n.includes('chaise-roulante')) return true;
  if (n.includes('deambulateur')) return true;
  return false;
}

/** Fragment SQL (AND …) pour MySQL, insensible à la casse selon collation habituelle. */
export function sqlStorefrontProductExclusion() {
  return ` AND NOT (
    LOWER(name) LIKE '%chaise roulante%'
    OR LOWER(name) LIKE '%chaise-roulante%'
    OR LOWER(name) LIKE '%déambulateur%'
    OR LOWER(name) LIKE '%deambulateur%'
  )`;
}
