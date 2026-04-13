import { DashboardService } from '../services/dashboardService.js';

export class DashboardController {
  constructor() {
    this.dashboardService = new DashboardService();
  }

  // Dashboard principal avec toutes les stats
  getDashboard = async (req, res, next) => {
    try {
      const stats = await this.dashboardService.getDashboardStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  // CA par période
  getRevenue = async (req, res, next) => {
    try {
      const { period = 'month' } = req.query;
      const revenue = await this.dashboardService.getRevenueStats(period);
      
      res.status(200).json({
        success: true,
        data: {
          period,
          ...revenue
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Ventes par catégorie
  getSalesByCategory = async (req, res, next) => {
    try {
      const { period = 'month' } = req.query;
      const sales = await this.dashboardService.getSalesByCategory(period);
      
      res.status(200).json({
        success: true,
        data: sales
      });
    } catch (error) {
      next(error);
    }
  };

  // Alertes stock
  getStockAlerts = async (req, res, next) => {
    try {
      const { threshold = 10 } = req.query;
      const alerts = await this.dashboardService.getStockAlerts(parseInt(threshold));
      
      res.status(200).json({
        success: true,
        data: alerts
      });
    } catch (error) {
      next(error);
    }
  };
}

