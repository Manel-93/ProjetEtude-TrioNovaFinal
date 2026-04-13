import { resolveMediaUrl } from './mediaUrl';
import {
  getMedicalCategoryDirectImageUrl,
  getCatalogFallbackCategoryImage
} from './catalogFallbackImages';
import { getPrimaryImageUrl } from './product';

/**
 * Couverture catégorie : URL directe Unsplash → image API → premier produit → fallback.
 * @param {{ name?: string, slug?: string, imageUrl?: string } | null} category
 * @param {{ name?: string, slug?: string, images?: unknown[] } | null | undefined} sampleProduct
 * @returns {string|null}
 */
export function getCategoryCoverImageUrl(category, sampleProduct) {
  if (!category) return null;
  const direct = getMedicalCategoryDirectImageUrl(category);
  if (direct) return direct;
  const fromApi = category.imageUrl?.trim?.();
  if (fromApi) return resolveMediaUrl(fromApi);
  if (sampleProduct) {
    const u = getPrimaryImageUrl(sampleProduct);
    if (u) return u;
  }
  return getCatalogFallbackCategoryImage(category) || null;
}
