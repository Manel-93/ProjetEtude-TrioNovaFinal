import ProductImage from '../models/ProductImage.js';

export class ProductImageRepository {
  async create(imageData) {
    const productImage = new ProductImage(imageData);
    await productImage.save();
    return productImage.toObject();
  }

  async findByProductId(productId) {
    const images = await ProductImage.find({ productId })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    return images;
  }

  /** Images pour plusieurs productId (une requête MongoDB). */
  async findByProductIds(productIds) {
    const ids = [
      ...new Set(
        (productIds || [])
          .map((id) => Number(id))
          .filter((n) => Number.isFinite(n))
      )
    ];
    if (ids.length === 0) return [];
    return ProductImage.find({ productId: { $in: ids } })
      .sort({ productId: 1, order: 1, createdAt: 1 })
      .lean();
  }

  async findById(id) {
    const image = await ProductImage.findById(id).lean();
    return image || null;
  }

  async findPrimaryByProductId(productId) {
    const image = await ProductImage.findOne({
      productId,
      isPrimary: true
    }).lean();
    return image || null;
  }

  async update(id, imageData) {
    const image = await ProductImage.findByIdAndUpdate(
      id,
      { $set: imageData },
      { new: true, runValidators: true }
    ).lean();
    return image;
  }

  async setPrimary(productId, imageId) {
    // Retirer le statut primary de tous les autres
    await ProductImage.updateMany(
      { productId, _id: { $ne: imageId } },
      { $set: { isPrimary: false } }
    );

    // Définir celui-ci comme primary
    const image = await ProductImage.findByIdAndUpdate(
      imageId,
      { $set: { isPrimary: true } },
      { new: true }
    ).lean();
    return image;
  }

  async delete(id) {
    await ProductImage.findByIdAndDelete(id);
    return true;
  }

  async deleteByProductId(productId) {
    await ProductImage.deleteMany({ productId });
    return true;
  }

  async updateOrder(productId, imageOrders) {
    // imageOrders est un tableau de { id, order }
    const updates = imageOrders.map(({ id, order }) =>
      ProductImage.findByIdAndUpdate(id, { $set: { order } })
    );
    await Promise.all(updates);
    return this.findByProductId(productId);
  }
}
