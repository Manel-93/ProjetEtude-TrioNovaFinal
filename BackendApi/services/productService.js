import { ProductRepository } from '../repositories/productRepository.js';
import { ProductImageRepository } from '../repositories/productImageRepository.js';
import { CategoryRepository } from '../repositories/categoryRepository.js';
import { ElasticsearchService } from './elasticsearchService.js';
import { isProductExcludedFromStorefront } from '../utils/storefrontProductExclusions.js';

function productNotFoundError() {
  const err = new Error('Produit introuvable');
  err.statusCode = 404;
  return err;
}

export class ProductService {
  constructor() {
    this.productRepository = new ProductRepository();
    this.productImageRepository = new ProductImageRepository();
    this.categoryRepository = new CategoryRepository();
    this.elasticsearchService = new ElasticsearchService();
  }

  async getAllProducts(filters, pagination, options = {}) {
    const result = await this.productRepository.findAll(filters, pagination, options);
    
    const productsWithImages = await Promise.all(
      result.data.map(async (product) => {
        const images = await this.productImageRepository.findByProductId(product.id);
        return {
          ...product,
          images
        };
      })
    );
    
    return {
      ...result,
      data: productsWithImages
    };
  }

  async getProductBySlug(slug, options = {}) {
    const product = await this.productRepository.findBySlug(slug);
    if (!product) {
      throw productNotFoundError();
    }
    if (options.excludeStorefrontHidden && isProductExcludedFromStorefront(product)) {
      throw productNotFoundError();
    }
    
    const images = await this.productImageRepository.findByProductId(product.id);
    const category = product.categoryId 
      ? await this.categoryRepository.findById(product.categoryId)
      : null;
    
    return {
      ...product,
      images,
      category
    };
  }

  async getProductById(id) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw productNotFoundError();
    }
    
    const images = await this.productImageRepository.findByProductId(product.id);
    const category = product.categoryId 
      ? await this.categoryRepository.findById(product.categoryId)
      : null;
    
    return {
      ...product,
      images,
      category
    };
  }

  async createProduct(productData) {
    const existingProduct = await this.productRepository.findBySlug(productData.slug);
    if (existingProduct) {
      throw new Error('Un produit avec ce slug existe déjà');
    }
    
    if (productData.categoryId) {
      const category = await this.categoryRepository.findById(productData.categoryId);
      if (!category) {
        throw new Error('Catégorie introuvable');
      }
    }
    
    const product = await this.productRepository.create(productData);
    
    if (productData.images && productData.images.length > 0) {
      const imagePromises = productData.images.map((imageData, index) => {
        return this.productImageRepository.create({
          ...imageData,
          productId: product.id,
          isPrimary: index === 0,
          order: index
        });
      });
      await Promise.all(imagePromises);
    }
    
    const fullProduct = await this.getProductById(product.id);
    
    // Synchronisation Elasticsearch (en arrière-plan, ne bloque pas la réponse)
    this.elasticsearchService.indexProduct(product.id).catch(err => {
      console.error(`⚠️  Failed to index product ${product.id} in Elasticsearch:`, err.message);
    });
    
    return fullProduct;
  }

  async updateProduct(id, productData) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw productNotFoundError();
    }
    
    if (productData.slug && productData.slug !== product.slug) {
      const existingProduct = await this.productRepository.findBySlug(productData.slug);
      if (existingProduct) {
        throw new Error('Un produit avec ce slug existe déjà');
      }
    }
    
    if (productData.categoryId) {
      const category = await this.categoryRepository.findById(productData.categoryId);
      if (!category) {
        throw new Error('Catégorie introuvable');
      }
    }
    
    const updatedProduct = await this.productRepository.update(id, productData);
    const fullProduct = await this.getProductById(updatedProduct.id);
    
    // Synchronisation Elasticsearch (en arrière-plan)
    this.elasticsearchService.indexProduct(id).catch(err => {
      console.error(`⚠️  Failed to update product ${id} in Elasticsearch:`, err.message);
    });
    
    return fullProduct;
  }

  async deleteProduct(id) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw productNotFoundError();
    }
    
    await this.productImageRepository.deleteByProductId(id);
    await this.productRepository.delete(id);
    
    // Synchronisation Elasticsearch (en arrière-plan)
    this.elasticsearchService.deleteProduct(id).catch(err => {
      console.error(`⚠️  Failed to delete product ${id} from Elasticsearch:`, err.message);
    });
    
    return { message: 'Produit supprimé avec succès' };
  }

  // === GESTION DES IMAGES (CORRIGÉE) ===
  
  async addProductImage(productId, imageData) {
    // Conversion explicite pour éviter les bugs de type MySQL (Number) vs URL (String)
    const pId = Number(productId);
    
    const product = await this.productRepository.findById(pId);
    if (!product) {
      throw productNotFoundError();
    }
    
    const existingImages = await this.productImageRepository.findByProductId(pId);
    const isPrimary = existingImages.length === 0;
    
    const image = await this.productImageRepository.create({
      ...imageData,
      productId: pId,
      isPrimary,
      order: existingImages.length
    });
    
    return image;
  }

  async updateProductImage(imageId, imageData) {
    const image = await this.productImageRepository.findById(imageId);
    if (!image) {
      throw new Error('Image introuvable');
    }
    
    return await this.productImageRepository.update(imageId, imageData);
  }

  async setPrimaryImage(productId, imageId) {
    // CORRECTION : Conversion des IDs pour la comparaison
    const pId = Number(productId);

    const product = await this.productRepository.findById(pId);
    if (!product) {
      throw productNotFoundError();
    }
    
    const image = await this.productImageRepository.findById(imageId);
    
    // CORRECTION : On compare des Numbers (Number vs Number)
    if (!image || Number(image.productId) !== pId) {
      throw new Error('Image introuvable');
    }
    
    return await this.productImageRepository.setPrimary(pId, imageId);
  }

  async deleteProductImage(imageId) {
    const image = await this.productImageRepository.findById(imageId);
    if (!image) {
      throw new Error('Image introuvable');
    }
    
    await this.productImageRepository.delete(imageId);
    return { message: 'Image supprimée avec succès' };
  }
}