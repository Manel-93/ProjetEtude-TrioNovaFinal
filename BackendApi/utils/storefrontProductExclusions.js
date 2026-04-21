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

  if (n.includes('seringue')) return true;

  if (
    (n.includes('gants') || n.includes('gant')) &&
    n.includes('nitrile') &&
    ((n.includes('non') && n.includes('poudre')) || (n.includes('sans') && n.includes('poudre')))
  ) {
    return true;
  }

  if ((n.includes('gueridon') || n.includes('guerido')) && n.includes('inox')) return true;

  if (n.includes('otoscope') && n.includes('fibre') && n.includes('optique')) return true;

  if (
    n.includes('table') &&
    n.includes('examen') &&
    (n.includes('electrique') || n.includes('electronique'))
  ) {
    return true;
  }

  if (
    n.includes('tensiometre') &&
    (n.includes('bras') || n.includes('brassard')) &&
    (n.includes('electrique') || n.includes('electronique'))
  ) {
    return true;
  }

  if (n.includes('capteur') && n.includes('plan') && n.includes('radiolog')) return true;

  if (n.includes('autoclave') && n.includes('classe') && /\bclasse\s*b\b/.test(n)) return true;

  return false;
}

/** Fragment SQL (AND …) pour MySQL */
export function sqlStorefrontProductExclusion() {
  return ` AND NOT (
    LOWER(name) LIKE '%chaise roulante%'
    OR LOWER(name) LIKE '%chaise-roulante%'
    OR LOWER(name) LIKE '%déambulateur%'
    OR LOWER(name) LIKE '%deambulateur%'
    OR LOWER(name) LIKE '%seringue%'
    OR (
      (LOWER(name) LIKE '%gants%' OR LOWER(name) LIKE '%gant%')
      AND LOWER(name) LIKE '%nitrile%'
      AND (
        (LOWER(name) LIKE '%non%' AND LOWER(name) LIKE '%poudre%')
        OR (LOWER(name) LIKE '%sans%' AND LOWER(name) LIKE '%poudre%')
      )
    )
    OR (
      (LOWER(name) LIKE '%gueridon%' OR LOWER(name) LIKE '%guerido%')
      AND LOWER(name) LIKE '%inox%'
    )
    OR (
      LOWER(name) LIKE '%otoscope%'
      AND LOWER(name) LIKE '%fibre%'
      AND LOWER(name) LIKE '%optique%'
    )
    OR (
      LOWER(name) LIKE '%table%'
      AND LOWER(name) LIKE '%examen%'
      AND (
        LOWER(name) LIKE '%electrique%' OR LOWER(name) LIKE '%electronique%'
        OR name LIKE '%électrique%' OR name LIKE '%électronique%'
      )
    )
    OR (
      (LOWER(name) LIKE '%tensiometre%' OR name LIKE '%tensiomètre%')
      AND (LOWER(name) LIKE '%bras%' OR LOWER(name) LIKE '%brassard%')
      AND (
        LOWER(name) LIKE '%electrique%' OR LOWER(name) LIKE '%electronique%'
        OR name LIKE '%électrique%' OR name LIKE '%électronique%'
      )
    )
    OR (
      LOWER(name) LIKE '%capteur%'
      AND LOWER(name) LIKE '%plan%'
      AND (LOWER(name) LIKE '%radiolog%' OR LOWER(name) LIKE '%radiologie%')
    )
    OR (
      LOWER(name) LIKE '%autoclave%'
      AND LOWER(name) LIKE '%classe%'
      AND LOWER(name) LIKE '%classe b%'
    )
  )`;
}
