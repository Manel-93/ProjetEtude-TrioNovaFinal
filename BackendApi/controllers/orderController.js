import { OrderService } from '../services/orderService.js';

export class OrderController {
  constructor() {
    this.orderService = new OrderService();
  }

  // Récupérer les commandes de l'utilisateur connecté
  getMyOrders = async (req, res, next) => {
    try {
      const userId = req.user?.userId || null;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentification requise' }
        });
      }

      const { page = 1, limit = 20 } = req.query;
      const result = await this.orderService.getUserOrders(userId, { page, limit });
      
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  // Récupérer une commande par ID
  getOrderById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId || null;
      
      const order = await this.orderService.getOrderById(parseInt(id), userId);
      
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  };

  // Récupérer toutes les commandes (admin)
  getAllOrders = async (req, res, next) => {
    try {
      const { status, userId, orderNumber, dateFrom, dateTo, sortBy = 'created_at', sortOrder = 'DESC', page = 1, limit = 50 } = req.query;
      const filters = {};
      
      if (status) filters.status = status;
      if (userId) filters.userId = parseInt(userId);
      if (orderNumber) filters.orderNumber = orderNumber;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      filters.sortBy = sortBy;
      filters.sortOrder = sortOrder;
      
      const result = await this.orderService.getAllOrders(filters, { page, limit });
      
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  // Mettre à jour le statut d'une commande (admin)
  updateOrderStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const changedBy = req.user?.userId || null;
      
      const order = await this.orderService.updateOrderStatus(
        parseInt(id),
        status,
        changedBy,
        notes
      );
      
      res.status(200).json({
        success: true,
        data: order,
        message: 'Statut de la commande mis à jour avec succès'
      });
    } catch (error) {
      next(error);
    }
  };
}

