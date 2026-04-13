import { getMySQLConnection } from '../config/database.js';

export class Admin2FARepository {
  mapRowToObject(row) {
    return {
      id: row.id,
      userId: row.user_id,
      secret: row.secret,
      isEnabled: row.is_enabled,
      backupCodes: row.backup_codes ? (typeof row.backup_codes === 'string' ? JSON.parse(row.backup_codes) : row.backup_codes) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async findByUserId(userId) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM admin_2fa WHERE user_id = ?',
      [userId]
    );
    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  async create(userId, secret) {
    const pool = await getMySQLConnection();
    const [result] = await pool.execute(
      'INSERT INTO admin_2fa (user_id, secret) VALUES (?, ?)',
      [userId, secret]
    );
    return this.findById(result.insertId);
  }

  async findById(id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM admin_2fa WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  async update(userId, data) {
    const pool = await getMySQLConnection();
    const updates = [];
    const params = [];

    if (data.isEnabled !== undefined) {
      updates.push('is_enabled = ?');
      params.push(data.isEnabled);
    }
    if (data.backupCodes !== undefined) {
      updates.push('backup_codes = ?');
      params.push(JSON.stringify(data.backupCodes));
    }

    if (updates.length === 0) {
      return this.findByUserId(userId);
    }

    params.push(userId);
    await pool.execute(
      `UPDATE admin_2fa SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      params
    );
    return this.findByUserId(userId);
  }

  async delete(userId) {
    const pool = await getMySQLConnection();
    await pool.execute('DELETE FROM admin_2fa WHERE user_id = ?', [userId]);
    return true;
  }
}

