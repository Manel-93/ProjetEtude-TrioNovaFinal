import { ContactMessageService } from '../services/contactMessageService.js';

export class ContactMessageController {
  constructor() {
    this.contactMessageService = new ContactMessageService();
  }

  // Créer un message de contact (public)
  create = async (req, res, next) => {
    try {
      const message = await this.contactMessageService.create({
        name: req.body.name,
        email: req.body.email,
        subject: req.body.subject,
        message: req.body.message,
        userId: req.user?.userId || null,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      res.status(201).json({
        success: true,
        data: message,
        message: 'Message envoyé avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  // Récupérer tous les messages (admin)
  getAll = async (req, res, next) => {
    try {
      const { status, assignedTo, page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
      const filters = {};
      
      if (status) filters.status = status;
      if (assignedTo) filters.assignedTo = parseInt(assignedTo);
      
      filters.sortBy = sortBy;
      filters.sortOrder = sortOrder.toUpperCase();

      const result = await this.contactMessageService.getAll(filters, { page, limit });
      
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  // Récupérer un message par ID (admin)
  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const message = await this.contactMessageService.getById(parseInt(id));
      
      res.status(200).json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  };

  // Mettre à jour le statut d'un message (admin)
  updateStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, assignedTo } = req.body;
      
      const message = await this.contactMessageService.updateStatus(
        parseInt(id),
        status,
        assignedTo ? parseInt(assignedTo) : null
      );
      
      res.status(200).json({
        success: true,
        data: message,
        message: 'Statut du message mis à jour avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  // Statistiques des messages (admin)
  getStats = async (req, res, next) => {
    try {
      const stats = await this.contactMessageService.getStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };
}

