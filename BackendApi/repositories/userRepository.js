import { getMySQLConnection } from '../config/database.js';

export class UserRepository {
  async findByEmail(email) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT id, email, first_name, last_name, phone, role, is_email_confirmed, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  async findAll(filters = {}, pagination = {}) {
    const pool = await getMySQLConnection();
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT id, email, first_name, last_name, phone, role, is_email_confirmed, is_active, created_at, updated_at FROM users WHERE 1=1';
    const params = [];
    
    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }
    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active);
    }
    if (filters.search) {
      query += ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.execute(query, params);
    
    // Compter le total
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];
    if (filters.role) {
      countQuery += ' AND role = ?';
      countParams.push(filters.role);
    }
    if (filters.is_active !== undefined) {
      countQuery += ' AND is_active = ?';
      countParams.push(filters.is_active);
    }
    if (filters.search) {
      countQuery += ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async create(userData) {
    const pool = await getMySQLConnection();
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, first_name, last_name, is_email_confirmed) VALUES (?, ?, ?, ?, ?)',
      [
        userData.email,
        userData.passwordHash,
        userData.firstName,
        userData.lastName,
        userData.isEmailConfirmed || false
      ]
    );
    return this.findById(result.insertId);
  }

  async updateEmailConfirmed(userId, isConfirmed) {
    const pool = await getMySQLConnection();
    await pool.execute(
      'UPDATE users SET is_email_confirmed = ? WHERE id = ?',
      [isConfirmed, userId]
    );
    return this.findById(userId);
  }

  async updatePassword(userId, passwordHash) {
    const pool = await getMySQLConnection();
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );
    return this.findById(userId);
  }

  async update(userId, userData) {
    const pool = await getMySQLConnection();
    const updates = [];
    const params = [];
    
    if (userData.firstName !== undefined) {
      updates.push('first_name = ?');
      params.push(userData.firstName);
    }
    if (userData.lastName !== undefined) {
      updates.push('last_name = ?');
      params.push(userData.lastName);
    }
    if (userData.phone !== undefined) {
      updates.push('phone = ?');
      params.push(userData.phone);
    }
    
    if (updates.length === 0) {
      return this.findById(userId);
    }
    
    params.push(userId);
    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(userId);
  }

  async updateStatus(userId, isActive) {
    const pool = await getMySQLConnection();
    await pool.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [isActive, userId]
    );
    return this.findById(userId);
  }

  async delete(userId) {
    const pool = await getMySQLConnection();
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    return true;
  }
}

