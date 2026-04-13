import { getMySQLConnection } from '../config/database.js';

export class OrderRepository {
  mapRowToObject(row) {
    return {
      id: row.id,
      orderNumber: row.order_number,
      userId: row.user_id,
      paymentId: row.payment_id,
      cartId: row.cart_id,
      subtotal: parseFloat(row.subtotal),
      tva: parseFloat(row.tva),
      total: parseFloat(row.total),
      currency: row.currency,
      status: row.status,
      shippingAddress: row.shipping_address ? (typeof row.shipping_address === 'string' ? JSON.parse(row.shipping_address) : row.shipping_address) : null,
      billingAddress: row.billing_address ? (typeof row.billing_address === 'string' ? JSON.parse(row.billing_address) : row.billing_address) : null,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Générer un numéro de commande unique
  async generateOrderNumber() {
    const pool = await getMySQLConnection();
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  // Créer une commande
  async create(orderData) {
    const pool = await getMySQLConnection();
    const orderNumber = await this.generateOrderNumber();
    
    const sqlParams = [
      orderNumber,
      orderData.userId || null,
      orderData.paymentId || null,
      orderData.cartId || null,
      orderData.subtotal,
      orderData.tva,
      orderData.total,
      orderData.currency || 'EUR',
      orderData.status || 'pending',
      orderData.shippingAddress ? JSON.stringify(orderData.shippingAddress) : null,
      orderData.billingAddress ? JSON.stringify(orderData.billingAddress) : null,
      orderData.metadata ? JSON.stringify(orderData.metadata) : null
    ];

    console.log('🔵 [ORDER REPOSITORY] Before INSERT INTO orders:');
    console.log('   SQL Columns: order_number, user_id, payment_id, cart_id, subtotal, tva, total, currency, status, shipping_address, billing_address, metadata');
    console.log('   Parameters:', {
      orderNumber,
      userId: orderData.userId || null,
      paymentId: orderData.paymentId || null,
      cartId: orderData.cartId || null,
      subtotal: orderData.subtotal,
      tva: orderData.tva,
      total: orderData.total,
      currency: orderData.currency || 'EUR',
      status: orderData.status || 'pending'
    });

    try {
      const [result] = await pool.execute(
        `INSERT INTO orders (
          order_number, user_id, payment_id, cart_id, subtotal, tva, total, 
          currency, status, shipping_address, billing_address, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        sqlParams
      );

      console.log('✅ [ORDER REPOSITORY] INSERT successful, insertId:', result.insertId);
      return this.findById(result.insertId);
    } catch (error) {
      console.error('❌ [ORDER REPOSITORY] SQL Error during INSERT:');
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   SQL state:', error.sqlState);
      console.error('   SQL query:', `INSERT INTO orders (...) VALUES (${sqlParams.length} params)`);
      throw error;
    }
  }

  // Trouver une commande par ID
  async findById(id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  // Trouver une commande par numéro
  async findByOrderNumber(orderNumber) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM orders WHERE order_number = ?',
      [orderNumber]
    );

    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  // Trouver une commande par payment ID
  async findByPaymentId(paymentId) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM orders WHERE payment_id = ?',
      [paymentId]
    );

    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  // Trouver les commandes d'un utilisateur
  async findByUserId(userId, limit = 50, offset = 0) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );

    return rows.map(row => this.mapRowToObject(row));
  }

  // Trouver toutes les commandes (admin)
  async findAll(filters = {}, pagination = {}) {
    const pool = await getMySQLConnection();
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }
    if (filters.orderNumber) {
      query += ' AND order_number LIKE ?';
      params.push(`%${filters.orderNumber}%`);
    }
    if (filters.dateFrom) {
      query += ' AND created_at >= ?';
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      query += ' AND created_at <= ?';
      params.push(filters.dateTo);
    }

    // Tri personnalisable
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    const allowedSortFields = ['created_at', 'updated_at', 'total', 'status', 'order_number'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);
    
    // Compter le total
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const countParams = [];
    if (filters.userId) {
      countQuery += ' AND user_id = ?';
      countParams.push(filters.userId);
    }
    if (filters.status) {
      countQuery += ' AND status = ?';
      countParams.push(filters.status);
    }
    if (filters.orderNumber) {
      countQuery += ' AND order_number LIKE ?';
      countParams.push(`%${filters.orderNumber}%`);
    }
    if (filters.dateFrom) {
      countQuery += ' AND created_at >= ?';
      countParams.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      countQuery += ' AND created_at <= ?';
      countParams.push(filters.dateTo);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    return {
      data: rows.map(row => this.mapRowToObject(row)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Mettre à jour le statut d'une commande
  async updateStatus(orderId, status, changedBy = null, notes = null) {
    const pool = await getMySQLConnection();
    await pool.execute(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, orderId]
    );

    // Ajouter dans l'historique
    await pool.execute(
      'INSERT INTO order_status_history (order_id, status, changed_by, notes) VALUES (?, ?, ?, ?)',
      [orderId, status, changedBy, notes]
    );

    return this.findById(orderId);
  }

  // Ajouter un item à une commande
  async addItem(orderId, itemData) {
    const pool = await getMySQLConnection();
    const [result] = await pool.execute(
      `INSERT INTO order_items (
        order_id, product_id, product_name, product_slug, quantity,
        unit_price_ht, unit_price_ttc, tva, subtotal, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        itemData.productId,
        itemData.productName,
        itemData.productSlug,
        itemData.quantity,
        itemData.unitPriceHt,
        itemData.unitPriceTtc,
        itemData.tva,
        itemData.subtotal,
        itemData.total
      ]
    );

    return result.insertId;
  }

  // Récupérer les items d'une commande
  async getOrderItems(orderId) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM order_items WHERE order_id = ? ORDER BY id',
      [orderId]
    );

    return rows.map(row => ({
      id: row.id,
      orderId: row.order_id,
      productId: row.product_id,
      productName: row.product_name,
      productSlug: row.product_slug,
      quantity: row.quantity,
      unitPriceHt: parseFloat(row.unit_price_ht),
      unitPriceTtc: parseFloat(row.unit_price_ttc),
      tva: parseFloat(row.tva),
      subtotal: parseFloat(row.subtotal),
      total: parseFloat(row.total),
      createdAt: row.created_at
    }));
  }

  // Récupérer l'historique des statuts
  async getStatusHistory(orderId) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      `SELECT osh.*, u.first_name, u.last_name, u.email
       FROM order_status_history osh
       LEFT JOIN users u ON osh.changed_by = u.id
       WHERE osh.order_id = ?
       ORDER BY osh.created_at ASC`,
      [orderId]
    );

    return rows.map(row => ({
      id: row.id,
      orderId: row.order_id,
      status: row.status,
      changedBy: row.changed_by ? {
        id: row.changed_by,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email
      } : null,
      notes: row.notes,
      createdAt: row.created_at
    }));
  }
}

