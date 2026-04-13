import { CategoryService } from '../services/categoryService.js';

export class AdminCategoryController {
  constructor() {
    this.categoryService = new CategoryService();
  }

  getAllCategories = async (req, res, next) => {
    try {
      const { status, hierarchy = 'false' } = req.query;
      const filters = {};
      if (status) filters.status = status;
      
      let categories;
      if (hierarchy === 'true') {
        categories = await this.categoryService.getAllCategoriesWithHierarchy(filters);
      } else {
        categories = await this.categoryService.getAllCategories(filters);
      }
      
      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const category = await this.categoryService.getCategoryById(id);
      res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req, res, next) => {
    try {
      const category = await this.categoryService.createCategory(req.body);
      res.status(201).json({
        success: true,
        data: category,
        message: 'Catégorie créée avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req, res, next) => {
    try {
      const { id } = req.params;
      const category = await this.categoryService.updateCategory(id, req.body);
      res.status(200).json({
        success: true,
        data: category,
        message: 'Catégorie mise à jour avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.categoryService.deleteCategory(id);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };
}

