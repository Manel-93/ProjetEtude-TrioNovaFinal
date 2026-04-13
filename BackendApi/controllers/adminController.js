import { UserService } from '../services/userService.js';

export class AdminController {
  constructor() {
    this.userService = new UserService();
  }

  getAllUsers = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, role, is_active, search } = req.query;
      const filters = {};
      if (role) filters.role = role;
      if (is_active !== undefined) filters.is_active = is_active === 'true';
      if (search) filters.search = search;
      
      const result = await this.userService.getAllUsers(filters, { page, limit });
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  updateUserStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const user = await this.userService.updateUserStatus(id, is_active);
      res.status(200).json({
        success: true,
        data: user,
        message: `Compte ${is_active ? 'activé' : 'désactivé'} avec succès`
      });
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.userService.deleteUser(id);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  // Reset mot de passe utilisateur (admin)
  resetUserPassword = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { newPassword, sendEmail = true } = req.body;
      
      const result = await this.userService.resetUserPassword(id, newPassword, sendEmail);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  // Stats CA par utilisateur
  getUserRevenueStats = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { period = 'month' } = req.query;
      
      const stats = await this.userService.getUserRevenueStats(parseInt(id), period);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };
}

