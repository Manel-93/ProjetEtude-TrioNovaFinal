/** @param {string} label @param {number} [w] @param {number} [h] */
export function placeholderUrl(label, w = 600, h = 400) {
  const text = encodeURIComponent(String(label || 'Image').trim());
  return `https://via.placeholder.com/${w}x${h}.png?text=${text}`;
}

function normalizeLabel(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ');
}

function toUnsplashKeywords(label) {
  const cleaned = normalizeLabel(label);
  if (!cleaned) return 'medical-equipment';
  return cleaned.split(' ').filter(Boolean).join(',');
}

export function buildUnsplashSourceUrl(label) {
  const q = encodeURIComponent(toUnsplashKeywords(label));
  return `https://source.unsplash.com/featured/?${q}`;
}

export function getDefaultMedicalImageUrl() {
  return buildUnsplashSourceUrl('medical equipment');
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** URLs fixes demandées (alignées avec le script MongoDB `update:medical-images`). */
export const MEDICAL_PRODUCT_DIRECT_IMAGE_URLS = {
  thermometreInfrarouge:
    'https://images.unsplash.com/photo-1585417239725-00feea715e12?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  tensiometreElectrique:
    'https://images.unsplash.com/photo-1747224317356-6dd1a4a078fd?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  stethoscopeMedical:
    'https://images.unsplash.com/photo-1655313719493-16ebe4906441?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
};

/** URLs de couverture catégories (alignées sur `npm run update:category-images`). */
export const MEDICAL_CATEGORY_DIRECT_IMAGE_URLS = {
  imagerieMedicale:
    'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  mobilierMedical:
    'https://plus.unsplash.com/premium_photo-1702599099948-5ed43d0a3048?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  consommablesMedicaux:
    'https://images.unsplash.com/photo-1603398938378-e54eab446dde?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  dispositifsDiagnostic:
    'https://images.unsplash.com/photo-1624004015322-a94d3a4eff39?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  sterilisationHygiene:
    'https://images.unsplash.com/photo-1628246979652-d4a5fa2d0245?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
};

/**
 * @param {{ slug?: string, name?: string } | null} category
 * @returns {string|null}
 */
export function getMedicalCategoryDirectImageUrl(category) {
  if (!category) return null;
  const hay = norm(`${category.slug || ''} ${category.name || ''}`);
  if (hay.includes('imagerie') && hay.includes('medic')) {
    return MEDICAL_CATEGORY_DIRECT_IMAGE_URLS.imagerieMedicale;
  }
  if (hay.includes('mobilier') && hay.includes('medic')) {
    return MEDICAL_CATEGORY_DIRECT_IMAGE_URLS.mobilierMedical;
  }
  if (
    (hay.includes('consommable') || hay.includes('consommables')) &&
    hay.includes('medic')
  ) {
    return MEDICAL_CATEGORY_DIRECT_IMAGE_URLS.consommablesMedicaux;
  }
  if (hay.includes('dispositif') && hay.includes('diagnostic')) {
    return MEDICAL_CATEGORY_DIRECT_IMAGE_URLS.dispositifsDiagnostic;
  }
  if (hay.includes('sterilisation') && hay.includes('hygiene')) {
    return MEDICAL_CATEGORY_DIRECT_IMAGE_URLS.sterilisationHygiene;
  }
  return null;
}

/**
 * Image catalogue explicite pour thermomètre infrarouge / tensiomètre électrique / stéthoscope.
 * @param {{ slug?: string, name?: string }} product
 * @returns {string|null}
 */
export function getMedicalProductDirectImageUrl(product) {
  const hay = norm(`${product?.slug || ''} ${product?.name || ''}`);
  if (hay.includes('thermometre') && hay.includes('infrarouge')) {
    return MEDICAL_PRODUCT_DIRECT_IMAGE_URLS.thermometreInfrarouge;
  }
  if (
    hay.includes('tensiometre') &&
    (hay.includes('electrique') || hay.includes('electronique')) &&
    !hay.includes('bras')
  ) {
    return MEDICAL_PRODUCT_DIRECT_IMAGE_URLS.tensiometreElectrique;
  }
  if (hay.includes('stethoscope') && (hay.includes('medical') || hay.includes('professionnel'))) {
    return MEDICAL_PRODUCT_DIRECT_IMAGE_URLS.stethoscopeMedical;
  }
  if (hay.includes('stethoscope')) {
    return MEDICAL_PRODUCT_DIRECT_IMAGE_URLS.stethoscopeMedical;
  }
  return null;
}

function matchThermometer(hay) {
  return /(thermomet|infrarouge|infrared|temp[eé]rature|sans.contact|forehead|frontal)/i.test(hay);
}

/** Inclut fautes courantes : sthétoscope, sthetoscope */
function matchStethoscope(hay) {
  return /(st[hé]?é?thoscope|stethoscope|stetho|auscult)/i.test(hay);
}

function matchBloodPressure(hay) {
  return /(tensio|tensiomet|tension|sphygmo|blood\s*pressure|pression\s*arterielle)/i.test(hay);
}

/**
 * @param {{ slug?: string, name?: string }} product
 * @returns {string|null} URL absolue HTTPS valide pour `ProductImage.url`
 */
export function getCatalogFallbackProductImage(product) {
  const hay = norm(`${product?.slug || ''} ${product?.name || ''}`);
  const base = product?.name || product?.slug || 'medical equipment';
  let label = base;
  if (matchThermometer(hay)) label = `${base} infrared thermometer medical device white background`;
  else if (matchStethoscope(hay)) label = `${base} stethoscope medical white background`;
  else if (matchBloodPressure(hay)) label = `${base} blood pressure monitor medical white background`;
  return buildUnsplashSourceUrl(label);
}

/**
 * @param {{ slug?: string, name?: string } | null} category
 * @returns {string|null}
 */
export function getCatalogFallbackCategoryImage(category) {
  if (!category) return null;
  const direct = getMedicalCategoryDirectImageUrl(category);
  if (direct) return direct;
  const label = category.name || category.slug || 'medical equipment category';
  return buildUnsplashSourceUrl(`${label} hospital medical`);
}

/** Libellés FR pour placeholders produits si besoin (tests / override UI) */
export const PRODUCT_PLACEHOLDERS = {
  infraredThermometer: placeholderUrl('Thermometre infrarouge', 600, 600),
  stethoscope: placeholderUrl('Stethoscope professionnel', 600, 600),
  bloodPressure: placeholderUrl('Tensiometre electronique', 600, 600)
};
