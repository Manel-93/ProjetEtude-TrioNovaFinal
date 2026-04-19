import { getMySQLConnection } from '../config/database.js';

export class OrderRepository {
  mapRowToObject(row) {
    const splitList = (value) =>
      value ? String(value).split('||').map((entry) => entry.trim()).filter(Boolean) : [];

    return {
      id: row.id,
      orderNumber: row.order_number,
      userId: row.user_id,
      customerEmail: row.customer_email || null,
      customerFirstName: row.customer_first_name || null,
      customerLastName: row.customer_last_name || null,
      paymentId: row.payment_id,
      cartId: row.cart_id,
      subtotal: parseFloat(row.subtotal),
      tva: parseFloat(row.tva),
      total: parseFloat(row.total),
      currency: row.currency,
      status: row.status,
      statusGroup:
        row.status === 'canceled'
          ? 'resiliee'
          : row.status === 'completed'
            ? 'terminee'
            : 'active',
      shippingAddress: row.shipping_address ? (typeof row.shipping_address === 'string' ? JSON.parse(row.shipping_address) : row.shipping_address) : null,
      billingAddress: row.billing_address ? (typeof row.billing_address === 'string' ? JSON.parse(row.billing_address) : row.billing_address) : null,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
      primaryProductName: row.primary_product_name || null,
      productNames: splitList(row.product_names),
      productTypes: splitList(row.product_types),
      itemCount: row.item_count != null ? parseInt(row.item_count, 10) : undefined,
      paymentLast4: row.payment_last4 || null,
      paymentBrand: row.payment_brand || null,
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
  buildUserOrdersFilters(filters = {}) {
    const clauses = [];
    const params = [];

    if (filters.year) {
      clauses.push('YEAR(o.created_at) = ?');
      params.push(parseInt(filters.year, 10));
    }

    if (filters.search) {
      const searchTerm = `%${String(filters.search).trim()}%`;
      clauses.push('(o.order_number LIKE ? OR DATE_FORMAT(o.created_at, "%d/%m/%Y") LIKE ? OR agg.product_names LIKE ?)');
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.productType) {
      clauses.push('agg.product_types LIKE ?');
      params.push(`%${filters.productType}%`);
    }

    if (filters.state === 'active') {
      clauses.push("o.status IN ('pending', 'processing')");
    } else if (filters.state === 'resiliee') {
      clauses.push("o.status = 'canceled'");
    } else if (filters.state === 'terminee') {
      clauses.push("o.status = 'completed'");
    }

    return { clauses, params };
  }

  // Trouver les commandes d'un utilisateur avec filtres
  async findByUserId(userId, filters = {}, limit = 50, offset = 0) {
    const pool = await getMySQLConnection();
    const aggregateQuery = `
      LEFT JOIN (
        SELECT
          oi.order_id,
          SUBSTRING_INDEX(GROUP_CONCAT(oi.product_name ORDER BY oi.id SEPARATOR '||'), '||', 1) AS primary_product_name,
          GROUP_CONCAT(DISTINCT oi.product_name SEPARATOR '||') AS product_names,
          GROUP_CONCAT(DISTINCT COALESCE(c.name, 'Autre') SEPARATOR '||') AS product_types,
          COUNT(*) AS item_count
        FROM order_items oi
        LEFT JOIN products p ON p.id = oi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        GROUP BY oi.order_id
      ) agg ON agg.order_id = o.id
    `;
    const { clauses, params } = this.buildUserOrdersFilters(filters);
    const whereClause = clauses.length ? ` AND ${clauses.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `SELECT o.*, agg.primary_product_name, agg.product_names, agg.product_types, agg.item_count,
              pm.last4 AS payment_last4, pm.brand AS payment_brand
       FROM orders o
       ${aggregateQuery}
       LEFT JOIN payment_methods pm ON pm.user_id = o.user_id AND pm.is_default = 1
       WHERE o.user_id = ?${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, ...params, limit, offset]
    );

    return rows.map(row => this.mapRowToObject(row));
  }

  async countByUserId(userId, filters = {}) {
    const pool = await getMySQLConnection();
    const aggregateQuery = `
      LEFT JOIN (
        SELECT
          oi.order_id,
          GROUP_CONCAT(DISTINCT oi.product_name SEPARATOR '||') AS product_names,
          GROUP_CONCAT(DISTINCT COALESCE(c.name, 'Autre') SEPARATOR '||') AS product_types
        FROM order_items oi
        LEFT JOIN products p ON p.id = oi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        GROUP BY oi.order_id
      ) agg ON agg.order_id = o.id
    `;
    const { clauses, params } = this.buildUserOrdersFilters(filters);
    const whereClause = clauses.length ? ` AND ${clauses.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM orders o
       ${aggregateQuery}
       WHERE o.user_id = ?${whereClause}`,
      [userId, ...params]
    );

    return parseInt(rows[0]?.total || 0, 10);
  }

  // Trouver toutes les commandes (admin)
  async findAll(filters = {}, pagination = {}) {
    const pool = await getMySQLConnection();
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT o.*,
        u.email AS customer_email,
        u.first_name AS customer_first_name,
        u.last_name AS customer_last_name
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND o.status = ?';
      params.push(filters.status);
    }
    if (filters.userId) {
      query += ' AND o.user_id = ?';
      params.push(filters.userId);
    }
    if (filters.orderNumber) {
      query += ' AND o.order_number LIKE ?';
      params.push(`%${filters.orderNumber}%`);
    }
    if (filters.dateFrom) {
      query += ' AND o.created_at >= ?';
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      query += ' AND o.created_at <= ?';
      params.push(filters.dateTo);
    }

    // Tri personnalisable
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    const allowedSortFields = ['created_at', 'updated_at', 'total', 'status', 'order_number'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const sortColumn = safeSortBy === 'order_number' ? 'o.order_number' : `o.${safeSortBy}`;
    query += ` ORDER BY ${sortColumn} ${safeSortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);
    
    // Compter le total
    let countQuery = 'SELECT COUNT(*) as total FROM orders o WHERE 1=1';
    const countParams = [];
    if (filters.userId) {
      countQuery += ' AND o.user_id = ?';
      countParams.push(filters.userId);
    }
    if (filters.status) {
      countQuery += ' AND o.status = ?';
      countParams.push(filters.status);
    }
    if (filters.orderNumber) {
      countQuery += ' AND o.order_number LIKE ?';
      countParams.push(`%${filters.orderNumber}%`);
    }
    if (filters.dateFrom) {
      countQuery += ' AND o.created_at >= ?';
      countParams.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      countQuery += ' AND o.created_at <= ?';
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

