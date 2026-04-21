import { resolveMediaUrl } from './mediaUrl';
import {
  getCatalogFallbackProductImage,
  getMedicalProductDirectImageUrl
} from './catalogFallbackImages';

const FORCE_OUT_OF_STOCK_TERMS = ['boite de gants nitrile'];

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function getPrimaryImage(product) {
  if (!product?.images?.length) return null;
  const list = [...product.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const primary = list.find((i) => i.isPrimary);
  return primary || list[0];
}

export function getPrimaryImageUrl(product) {
  const img = getPrimaryImage(product);
  if (img?.url) return resolveMediaUrl(img.url);
  const direct = getMedicalProductDirectImageUrl(product);
  if (direct) return direct;
  return getCatalogFallbackProductImage(product);
}

/**
 * Galerie fiche produit : applique l’image directe sur la 1re vignette si définie.
 * @param {{ name?: string, slug?: string, images?: Array<{ id?: string, url?: string, order?: number, isPrimary?: boolean }> }} product
 */
export function buildProductGalleryImages(product) {
  const sorted = [...(product.images || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (sorted.length > 0) return sorted;
  const direct = getMedicalProductDirectImageUrl(product);
  if (direct) return [{ id: 'direct-medical', url: direct, order: 0, isPrimary: true }];
  return [];
}

export function isInStock(product) {
  const normalized = normalizeName(product?.name);
  if (FORCE_OUT_OF_STOCK_TERMS.some((term) => normalized.includes(term))) return false;

  const rawCandidates = [
    product?.stock,
    product?.stockQuantity,
    product?.quantity,
    product?.availableStock,
    product?.inventory?.stock
  ];
  const parsed = rawCandidates
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));
  if (!parsed.length) return false;

  // If one source reports 0 stock, we consider the product out of stock.
  return Math.min(...parsed) > 0;
}
