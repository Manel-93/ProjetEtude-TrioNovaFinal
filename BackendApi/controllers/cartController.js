import { CartService } from '../services/cartService.js';

export class CartController {
  constructor() {
    this.cartService = new CartService();
  }

  // Obtenir le panier
  getCart = async (req, res, next) => {
    try {
      const userId = req.user?.userId || null;
      const guestToken = req.guestToken || null;

      const cart = await this.cartService.getCart(userId, guestToken);
      
      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error) {
      next(error);
    }
  };

  // Ajouter un produit au panier
  addItem = async (req, res, next) => {
    try {
      const userId = req.user?.userId || null;
      const guestToken = req.guestToken || null;
      const { productId, quantity = 1 } = req.body;

      const cart = await this.cartService.addItem(userId, guestToken, productId, quantity);
      
      res.status(200).json({
        success: true,
        data: cart,
        message: 'Produit ajouté au panier avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  // Mettre à jour la quantité d'un produit
  updateItem = async (req, res, next) => {
    try {
      const userId = req.user?.userId || null;
      const guestToken = req.guestToken || null;
      const { productId, quantity } = req.body;

      const cart = await this.cartService.updateItem(userId, guestToken, productId, quantity);
      
      res.status(200).json({
        success: true,
        data: cart,
        message: 'Quantité mise à jour avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  // Supprimer un produit du panier
  removeItem = async (req, res, next) => {
    try {
      const userId = req.user?.userId || null;
      const guestToken = req.guestToken || null;
      const { productId } = req.body;

      const cart = await this.cartService.removeItem(userId, guestToken, productId);
      
      res.status(200).json({
        success: true,
        data: cart,
        message: 'Produit supprimé du panier avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  // Vérifier le stock du panier (pour checkout)
  validateCart = async (req, res, next) => {
    try {
      const userId = req.user?.userId || null;
      const guestToken = req.guestToken || null;

      const result = await this.cartService.validateCartStock(userId, guestToken);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Le panier est valide pour le checkout'
      });
    } catch (error) {
      next(error);
    }
  };
}

