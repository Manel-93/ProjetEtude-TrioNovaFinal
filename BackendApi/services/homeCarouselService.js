import { HomeCarouselRepository } from '../repositories/homeCarouselRepository.js';
import { ProductService } from './productService.js';
import { isProductExcludedFromStorefront } from '../utils/storefrontProductExclusions.js';

function primaryImageUrl(product) {
  const imgs = product?.images || [];
  const p = imgs.find((i) => i.isPrimary) || imgs[0];
  return p?.url || '';
}

export class HomeCarouselService {
  constructor() {
    this.repository = new HomeCarouselRepository();
    this.productService = new ProductService();
  }

  async getAdminSlides() {
    return this.repository.findAll();
  }

  async replaceAdminSlides(slides) {
    if (!Array.isArray(slides)) {
      throw new Error('Le corps doit contenir un tableau "slides"');
    }
    return this.repository.replaceAll(slides);
  }

  /**
   * Diapositives actives enrichies pour la vitrine (image, titre, lien).
   * Les entrées sans image exploitable sont ignorées.
   */
  async getPublicSlides() {
    const rows = await this.repository.findAllActive();
    const out = [];

    for (const row of rows) {
      const dto = {
        id: row.id,
        productId: row.productId,
        imageUrl: row.imageUrl || '',
        linkUrl: row.linkUrl || '',
        title: row.title || '',
        subtitle: row.subtitle || '',
        slug: null
      };

      if (row.productId) {
        try {
          const product = await this.productService.getProductById(row.productId);
          if (product.status !== 'active') continue;
          if (isProductExcludedFromStorefront(product)) continue;

          const pImg = primaryImageUrl(product);
          if (!dto.imageUrl && pImg) dto.imageUrl = pImg;
          if (!dto.title) dto.title = product.name;
          if (!dto.subtitle) {
            const desc = product.description || '';
            dto.subtitle = desc.length > 220 ? `${desc.slice(0, 217)}…` : desc;
          }
          dto.slug = product.slug;
          if (!dto.linkUrl) {
            dto.linkUrl = `/produit/${encodeURIComponent(product.slug)}`;
          }
        } catch {
          continue;
        }
      }

      if (!dto.imageUrl) continue;
      out.push(dto);
    }

    return out;
  }
}
