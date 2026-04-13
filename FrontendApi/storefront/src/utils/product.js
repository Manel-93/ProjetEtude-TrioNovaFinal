import { resolveMediaUrl } from './mediaUrl';
import {
  getCatalogFallbackProductImage,
  getMedicalProductDirectImageUrl
} from './catalogFallbackImages';

export function getPrimaryImage(product) {
  if (!product?.images?.length) return null;
  const list = [...product.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const primary = list.find((i) => i.isPrimary);
  return primary || list[0];
}

export function getPrimaryImageUrl(product) {
  const direct = getMedicalProductDirectImageUrl(product);
  if (direct) return direct;
  const img = getPrimaryImage(product);
  if (img?.url) return resolveMediaUrl(img.url);
  return getCatalogFallbackProductImage(product);
}

/**
 * Galerie fiche produit : applique l’image directe sur la 1re vignette si définie.
 * @param {{ name?: string, slug?: string, images?: Array<{ id?: string, url?: string, order?: number, isPrimary?: boolean }> }} product
 */
export function buildProductGalleryImages(product) {
  const direct = getMedicalProductDirectImageUrl(product);
  const sorted = [...(product.images || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (sorted.length === 0) {
    return direct
      ? [{ id: 'direct-medical', url: direct, order: 0, isPrimary: true }]
      : [];
  }
  if (!direct) return sorted;
  return sorted.map((im, i) => (i === 0 ? { ...im, url: direct } : im));
}

export function isInStock(product) {
  const s = product?.stock ?? 0;
  return s > 0;
}
