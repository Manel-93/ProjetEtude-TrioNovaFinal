import { ProductService } from '../services/productService.js';

export class AdminProductController {
  constructor() {
    this.productService = new ProductService();
  }

  getAllProducts = async (req, res, next) => {
    try {
      const { page = 1, limit = 20, categoryId, status, search, inStock } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (categoryId) filters.categoryId = parseInt(categoryId);
      if (search) filters.search = search;
      if (inStock !== undefined) filters.inStock = inStock === 'true';
      
      const result = await this.productService.getAllProducts(filters, { page, limit });
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  getProductById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const product = await this.productService.getProductById(id);
      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  createProduct = async (req, res, next) => {
    try {
      const product = await this.productService.createProduct(req.body);
      res.status(201).json({
        success: true,
        data: product,
        message: 'Produit créé avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req, res, next) => {
    try {
      const { id } = req.params;
      const product = await this.productService.updateProduct(id, req.body);
      res.status(200).json({
        success: true,
        data: product,
        message: 'Produit mis à jour avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.productService.deleteProduct(id);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  addProductImage = async (req, res, next) => {
    try {
      const { id } = req.params;
      const image = await this.productService.addProductImage(id, req.body);
      res.status(201).json({
        success: true,
        data: image,
        message: 'Image ajoutée avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  updateProductImage = async (req, res, next) => {
    try {
      const { imageId } = req.params;
      const image = await this.productService.updateProductImage(imageId, req.body);
      res.status(200).json({
        success: true,
        data: image,
        message: 'Image mise à jour avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  setPrimaryImage = async (req, res, next) => {
    try {
      const { id, imageId } = req.params;
      const image = await this.productService.setPrimaryImage(id, imageId);
      res.status(200).json({
        success: true,
        data: image,
        message: 'Image principale mise à jour'
      });
    } catch (error) {
      next(error);
    }
  };

  deleteProductImage = async (req, res, next) => {
    try {
      const { imageId } = req.params;
      const result = await this.productService.deleteProductImage(imageId);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };
}

