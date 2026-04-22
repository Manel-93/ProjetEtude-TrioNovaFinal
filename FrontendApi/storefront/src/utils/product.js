import { resolveMediaUrl } from './mediaUrl';
import {
  getCatalogFallbackProductImage,
  getMedicalProductDirectImageUrl
} from './catalogFallbackImages';

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

export function getProductStockValue(product) {
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
  if (!parsed.length) return null;

  return Math.min(...parsed);
}

export function isInStock(product) {
  const stock = getProductStockValue(product);
  if (stock == null) return true;
  return stock > 0;
}
