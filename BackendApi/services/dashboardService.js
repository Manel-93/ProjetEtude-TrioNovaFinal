import { getMySQLConnection } from '../config/database.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { ContactMessageRepository } from '../repositories/contactMessageRepository.js';

export class DashboardService {
  constructor() {
    this.orderRepository = new OrderRepository();
    this.productRepository = new ProductRepository();
    this.contactMessageRepository = new ContactMessageRepository();
  }

  // CA par période (jour, semaine, mois)
  async getRevenueStats(period = 'month') {
    const pool = await getMySQLConnection();
    let dateFilter = '';
    const params = [];

    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    dateFilter = 'WHERE o.created_at >= ?';
    params.push(startDate.toISOString().slice(0, 19).replace('T', ' '));

    const [rows] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT o.id) as orders_count,
        SUM(o.total) as total_revenue,
        SUM(o.subtotal) as total_subtotal,
        SUM(o.tva) as total_tva,
        AVG(o.total) as average_order_value
      FROM orders o
      ${dateFilter}
      AND o.status != 'canceled'
    `, params);

    return rows[0] || {
      ordersCount: 0,
      totalRevenue: 0,
      totalSubtotal: 0,
      totalTva: 0,
      averageOrderValue: 0
    };
  }

  // Ventes par catégorie
  async getSalesByCategory(period = 'month') {
    const pool = await getMySQLConnection();
    let dateFilter = '';
    const params = [];

    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    dateFilter = 'AND o.created_at >= ?';
    params.push(startDate.toISOString().slice(0, 19).replace('T', ' '));

    const [rows] = await pool.execute(`
      SELECT 
        c.id,
        c.name,
        COUNT(DISTINCT o.id) as orders_count,
        SUM(oi.total) as total_revenue,
        SUM(oi.quantity) as total_quantity
      FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
      INNER JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.status != 'canceled'
      ${dateFilter}
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `, params);

    return rows.map(row => ({
      categoryId: row.id,
      categoryName: row.name || 'Sans catégorie',
      ordersCount: parseInt(row.orders_count),
      totalRevenue: parseFloat(row.total_revenue),
      totalQuantity: parseInt(row.total_quantity)
    }));
  }

  // Alertes stock (produits en rupture ou faible stock)
  async getStockAlerts(threshold = 10) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(`
      SELECT 
        id,
        name,
        slug,
        stock,
        status
      FROM products
      WHERE stock <= ? AND status = 'active'
      ORDER BY stock ASC
      LIMIT 50
    `, [threshold]);

    return rows.map(row => ({
      productId: row.id,
      productName: row.name,
      productSlug: row.slug,
      stock: row.stock,
      status: row.status,
      alertLevel: row.stock === 0 ? 'out_of_stock' : row.stock <= 5 ? 'critical' : 'low'
    }));
  }

  // Messages non traités
  async getPendingMessages() {
    const stats = await this.contactMessageRepository.countByStatus();
    return {
      pending: stats.pending || 0,
      inProgress: stats.in_progress || 0,
      totalUnresolved: (stats.pending || 0) + (stats.in_progress || 0)
    };
  }

  // Statistiques générales du dashboard
  async getDashboardStats() {
    const pool = await getMySQLConnection();

    // CA aujourd'hui, cette semaine, ce mois
    const revenueToday = await this.getRevenueStats('day');
    const revenueWeek = await this.getRevenueStats('week');
    const revenueMonth = await this.getRevenueStats('month');

    // Commandes par statut
    const [orderStats] = await pool.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total) as total_amount
      FROM orders
      GROUP BY status
    `);

    // Total utilisateurs
    const [userStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
        COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admin_users
      FROM users
    `);

    // Produits
    const [productStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
        COUNT(CASE WHEN stock <= 10 THEN 1 END) as low_stock_products
      FROM products
    `);

    // Ventes par catégorie
    const salesByCategory = await this.getSalesByCategory('month');

    // Alertes stock
    const stockAlerts = await this.getStockAlerts(10);

    // Messages
    const messages = await this.getPendingMessages();

    return {
      revenue: {
        today: {
          amount: parseFloat(revenueToday.total_revenue || 0),
          ordersCount: parseInt(revenueToday.orders_count || 0),
          averageOrderValue: parseFloat(revenueToday.average_order_value || 0)
        },
        week: {
          amount: parseFloat(revenueWeek.total_revenue || 0),
          ordersCount: parseInt(revenueWeek.orders_count || 0),
          averageOrderValue: parseFloat(revenueWeek.average_order_value || 0)
        },
        month: {
          amount: parseFloat(revenueMonth.total_revenue || 0),
          ordersCount: parseInt(revenueMonth.orders_count || 0),
          averageOrderValue: parseFloat(revenueMonth.average_order_value || 0)
        }
      },
      orders: orderStats.reduce((acc, row) => {
        acc[row.status] = {
          count: parseInt(row.count),
          totalAmount: parseFloat(row.total_amount || 0)
        };
        return acc;
      }, {}),
      users: {
        total: parseInt(userStats[0].total_users),
        active: parseInt(userStats[0].active_users),
        admins: parseInt(userStats[0].admin_users)
      },
      products: {
        total: parseInt(productStats[0].total_products),
        active: parseInt(productStats[0].active_products),
        lowStock: parseInt(productStats[0].low_stock_products)
      },
      salesByCategory,
      stockAlerts: stockAlerts.slice(0, 10), // Top 10
      messages
    };
  }
}

