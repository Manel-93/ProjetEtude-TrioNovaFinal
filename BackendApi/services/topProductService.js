import { ProductRepository } from '../repositories/productRepository.js';
import { ProductImageRepository } from '../repositories/productImageRepository.js';

export class TopProductService {
  constructor() {
    this.productRepository = new ProductRepository();
    this.productImageRepository = new ProductImageRepository();
  }

  async enrichWithImage(product) {
    const primary = await this.productImageRepository.findPrimaryByProductId(product.id);
    return {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      priceTtc: product.priceTtc,
      stock: product.stock,
      status: product.status,
      priority: product.priority,
      imageUrl: primary?.url || ''
    };
  }

  async list() {
    const rows = await this.productRepository.findTopProducts(200);
    const out = [];
    for (const row of rows) {
      out.push(await this.enrichWithImage(row));
    }
    return out;
  }

  async add(productId) {
    const p = await this.productRepository.findById(productId);
    if (!p) throw new Error('Produit introuvable');
    if (p.priority > 0) {
      return this.list();
    }

    const maxPriority = await this.productRepository.getMaxPriority();
    await this.productRepository.setPriority(productId, maxPriority + 1);
    return this.list();
  }

  async remove(productId) {
    const p = await this.productRepository.findById(productId);
    if (!p) throw new Error('Produit introuvable');

    await this.productRepository.setPriority(productId, 0);
    await this.reorder((await this.list()).map((x) => x.productId));
    return this.list();
  }

  async reorder(orderedProductIds) {
    if (!Array.isArray(orderedProductIds) || orderedProductIds.length === 0) {
      return this.list();
    }

    const uniqueIds = [...new Set(orderedProductIds.map((id) => Number(id)).filter((id) => id > 0))];
    const topRows = await this.productRepository.findTopProducts(500);
    const topIds = new Set(topRows.map((r) => Number(r.id)));

    // Retirer du top les ids absents de l'ordre demandé
    for (const row of topRows) {
      if (!uniqueIds.includes(Number(row.id))) {
        await this.productRepository.setPriority(row.id, 0);
      }
    }

    // Appliquer l'ordre en priorité décroissante (1er = plus haut)
    let priority = uniqueIds.length;
    for (const id of uniqueIds) {
      if (!topIds.has(id)) continue;
      await this.productRepository.setPriority(id, priority);
      priority -= 1;
    }

    return this.list();
  }
}

