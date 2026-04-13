import { TopProductService } from '../services/topProductService.js';

export class TopProductController {
  constructor() {
    this.service = new TopProductService();
  }

  getAll = async (req, res, next) => {
    try {
      const data = await this.service.list();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  add = async (req, res, next) => {
    try {
      const { productId } = req.body;
      const data = await this.service.add(Number(productId));
      res.status(200).json({ success: true, data, message: 'Produit ajouté au top' });
    } catch (error) {
      next(error);
    }
  };

  remove = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const data = await this.service.remove(Number(productId));
      res.status(200).json({ success: true, data, message: 'Produit retiré du top' });
    } catch (error) {
      next(error);
    }
  };

  reorder = async (req, res, next) => {
    try {
      const { orderedProductIds } = req.body;
      const data = await this.service.reorder(orderedProductIds);
      res.status(200).json({ success: true, data, message: 'Top produits réordonné' });
    } catch (error) {
      next(error);
    }
  };
}

