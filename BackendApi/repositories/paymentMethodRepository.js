import { getMySQLConnection } from '../config/database.js';

export class PaymentMethodRepository {
  async create(paymentData) {
    const pool = await getMySQLConnection();
    const [result] = await pool.execute(`
      INSERT INTO payment_methods (
        user_id, stripe_customer_id, stripe_payment_method_id, type,
        is_default, last4, brand, expiry_month, expiry_year
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      paymentData.userId,
      paymentData.stripeCustomerId,
      paymentData.stripePaymentMethodId,
      paymentData.type || 'card',
      paymentData.isDefault || false,
      paymentData.last4 || null,
      paymentData.brand || null,
      paymentData.expiryMonth || null,
      paymentData.expiryYear || null
    ]);
    return this.findById(result.insertId);
  }

  async findByUserId(userId) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return rows.map(row => this.mapRowToObject(row));
  }

  async findById(id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute('SELECT * FROM payment_methods WHERE id = ?', [id]);
    return rows[0] ? this.mapRowToObject(rows[0]) : null;
  }

  async findByUserIdAndId(userId, id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM payment_methods WHERE user_id = ? AND id = ?',
      [userId, id]
    );
    return rows[0] ? this.mapRowToObject(rows[0]) : null;
  }

  async findByUserIdAndStripePaymentMethodId(userId, stripePaymentMethodId) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM payment_methods WHERE user_id = ? AND stripe_payment_method_id = ? LIMIT 1',
      [userId, stripePaymentMethodId]
    );
    return rows[0] ? this.mapRowToObject(rows[0]) : null;
  }

  async setDefault(userId, paymentMethodId) {
    const pool = await getMySQLConnection();
    
    // Retirer le statut default de tous les autres
    await pool.execute(
      'UPDATE payment_methods SET is_default = FALSE WHERE user_id = ? AND id != ?',
      [userId, paymentMethodId]
    );
    
    // Définir celui-ci comme default
    await pool.execute(
      'UPDATE payment_methods SET is_default = TRUE WHERE user_id = ? AND id = ?',
      [userId, paymentMethodId]
    );
    
    return this.findById(paymentMethodId);
  }

  async delete(userId, id) {
    const pool = await getMySQLConnection();
    await pool.execute('DELETE FROM payment_methods WHERE user_id = ? AND id = ?', [userId, id]);
    return true;
  }

  async deleteByUserId(userId) {
    const pool = await getMySQLConnection();
    await pool.execute('DELETE FROM payment_methods WHERE user_id = ?', [userId]);
    return true;
  }

  // Mapper les colonnes SQL vers les noms camelCase
  mapRowToObject(row) {
    return {
      id: row.id,
      userId: row.user_id,
      stripeCustomerId: row.stripe_customer_id,
      stripePaymentMethodId: row.stripe_payment_method_id,
      type: row.type,
      isDefault: row.is_default === 1 || row.is_default === true,
      last4: row.last4,
      brand: row.brand,
      expiryMonth: row.expiry_month,
      expiryYear: row.expiry_year,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

