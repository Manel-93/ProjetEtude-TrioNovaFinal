import { getMySQLConnection } from '../config/database.js';

export class PaymentRepository {
  mapRowToObject(row) {
    return {
      id: row.id,
      userId: row.user_id,
      cartId: row.cart_id,
      stripePaymentIntentId: row.stripe_payment_intent_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Créer un paiement
  async create(paymentData) {
    const pool = await getMySQLConnection();
    const [result] = await pool.execute(
      `INSERT INTO payments (
        user_id, cart_id, stripe_payment_intent_id, amount, currency, status, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentData.userId || null,
        paymentData.cartId || null,
        paymentData.stripePaymentIntentId,
        paymentData.amount,
        paymentData.currency || 'EUR',
        paymentData.status || 'pending',
        paymentData.metadata ? JSON.stringify(paymentData.metadata) : null
      ]
    );

    return this.findById(result.insertId);
  }

  // Trouver un paiement par ID
  async findById(id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM payments WHERE id = ?',
      [id]
    );

    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  // Trouver un paiement par PaymentIntent ID
  async findByPaymentIntentId(paymentIntentId) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM payments WHERE stripe_payment_intent_id = ?',
      [paymentIntentId]
    );

    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  // Mettre à jour le statut d'un paiement
  async updateStatus(paymentIntentId, status, metadata = null) {
    const pool = await getMySQLConnection();
    const updateFields = ['status = ?'];
    const params = [status, paymentIntentId];

    if (metadata) {
      updateFields.push('metadata = ?');
      params.splice(1, 0, JSON.stringify(metadata));
    }

    await pool.execute(
      `UPDATE payments SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE stripe_payment_intent_id = ?`,
      params
    );

    return this.findByPaymentIntentId(paymentIntentId);
  }

  // Trouver les paiements d'un utilisateur
  async findByUserId(userId, limit = 50, offset = 0) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );

    return rows.map(row => this.mapRowToObject(row));
  }

  // Trouver les paiements d'un panier
  async findByCartId(cartId) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM payments WHERE cart_id = ? ORDER BY created_at DESC',
      [cartId]
    );

    return rows.map(row => this.mapRowToObject(row));
  }
}

