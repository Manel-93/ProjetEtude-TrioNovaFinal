import { ProductService } from '../services/productService.js';
import { CategoryService } from '../services/categoryService.js';

export class ProductController {
  constructor() {
    this.productService = new ProductService();
    this.categoryService = new CategoryService();
  }

  getPublicCategories = async (req, res, next) => {
    try {
      const categories = await this.categoryService.getAllCategories({ status: 'active' });
      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  };

  getAllProducts = async (req, res, next) => {
    try {
      const { page = 1, limit = 20, categoryId, status, search, inStock } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (categoryId) filters.categoryId = parseInt(categoryId);
      if (search) filters.search = search;
      if (inStock !== undefined) filters.inStock = inStock === 'true';
      
      const result = await this.productService.getAllProducts(filters, { page, limit }, {
        excludeStorefrontHidden: true
      });
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  getProductBySlug = async (req, res, next) => {
    try {
      const { slug } = req.params;
      const product = await this.productService.getProductBySlug(slug, {
        excludeStorefrontHidden: true
      });
      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  };
}

