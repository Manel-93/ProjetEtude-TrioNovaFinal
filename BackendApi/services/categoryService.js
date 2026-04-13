import { CategoryRepository } from '../repositories/categoryRepository.js';
import { ProductRepository } from '../repositories/productRepository.js';

export class CategoryService {
  constructor() {
    this.categoryRepository = new CategoryRepository();
    this.productRepository = new ProductRepository();
  }

  async getAllCategories(filters = {}) {
    return await this.categoryRepository.findAll(filters);
  }

  async getAllCategoriesWithHierarchy(filters = {}) {
    return await this.categoryRepository.findAllWithChildren(filters);
  }

  async getCategoryBySlug(slug) {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new Error('Catégorie introuvable');
    }
    
    // Compter les produits de cette catégorie
    const productsResult = await this.productRepository.findAll(
      { categoryId: category.id, status: 'active' },
      { page: 1, limit: 1 }
    );
    
    return {
      ...category,
      productCount: productsResult.pagination.total
    };
  }

  async getCategoryById(id) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new Error('Catégorie introuvable');
    }
    return category;
  }

  async createCategory(categoryData) {
    // Vérifier que le slug est unique
    const existingCategory = await this.categoryRepository.findBySlug(categoryData.slug);
    if (existingCategory) {
      throw new Error('Une catégorie avec ce slug existe déjà');
    }
    
    return await this.categoryRepository.create(categoryData);
  }

  async updateCategory(id, categoryData) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new Error('Catégorie introuvable');
    }
    
    // Vérifier que le slug est unique si modifié
    if (categoryData.slug && categoryData.slug !== category.slug) {
      const existingCategory = await this.categoryRepository.findBySlug(categoryData.slug);
      if (existingCategory) {
        throw new Error('Une catégorie avec ce slug existe déjà');
      }
    }
    
    return await this.categoryRepository.update(id, categoryData);
  }

  async deleteCategory(id) {
    const numericId = Number.parseInt(String(id), 10);
    if (Number.isNaN(numericId)) {
      throw new Error('Identifiant de catégorie invalide');
    }

    const category = await this.categoryRepository.findById(numericId);
    if (!category) {
      throw new Error('Catégorie introuvable');
    }

    const childCount = await this.categoryRepository.countByParentId(numericId);
    if (childCount > 0) {
      throw new Error(
        'Impossible de supprimer une catégorie qui contient des sous-catégories. Supprimez ou déplacez-les d’abord.'
      );
    }

    // Vérifier qu'il n'y a pas de produits associés
    const productsResult = await this.productRepository.findAll(
      { categoryId: numericId },
      { page: 1, limit: 1 }
    );

    if (productsResult.pagination.total > 0) {
      throw new Error('Impossible de supprimer une catégorie contenant des produits');
    }

    await this.categoryRepository.delete(numericId);
    return { message: 'Catégorie supprimée avec succès' };
  }
}

