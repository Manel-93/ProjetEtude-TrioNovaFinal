import mongoose from 'mongoose';

const productImageSchema = new mongoose.Schema({
  productId: {
    type: Number,
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true
  },
  alt: {
    type: String
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
productImageSchema.index({ productId: 1, order: 1 });
productImageSchema.index({ productId: 1, isPrimary: 1 });

const ProductImage = mongoose.model('ProductImage', productImageSchema);

export default ProductImage;

