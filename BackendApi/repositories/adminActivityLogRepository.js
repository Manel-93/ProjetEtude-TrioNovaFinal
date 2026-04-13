import { getMySQLConnection } from '../config/database.js';

export class AdminActivityLogRepository {
  mapRowToObject(row) {
    return {
      id: row.id,
      adminId: row.admin_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: row.details ? (typeof row.details === 'string' ? JSON.parse(row.details) : row.details) : null,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at
    };
  }

  async create(logData) {
    const pool = await getMySQLConnection();
    const [result] = await pool.execute(
      `INSERT INTO admin_activity_logs (admin_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        logData.adminId,
        logData.action,
        logData.entityType || null,
        logData.entityId || null,
        logData.details ? JSON.stringify(logData.details) : null,
        logData.ipAddress || null,
        logData.userAgent || null
      ]
    );
    return this.findById(result.insertId);
  }

  async findById(id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM admin_activity_logs WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  async findByAdminId(adminId, pagination = {}) {
    const pool = await getMySQLConnection();
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;
    
    const [rows] = await pool.execute(
      'SELECT * FROM admin_activity_logs WHERE admin_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [adminId, limit, offset]
    );
    return rows.map(row => this.mapRowToObject(row));
  }

  async findAll(filters = {}, pagination = {}) {
    const pool = await getMySQLConnection();
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM admin_activity_logs WHERE 1=1';
    const params = [];

    if (filters.adminId) {
      query += ' AND admin_id = ?';
      params.push(filters.adminId);
    }
    if (filters.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }
    if (filters.entityType) {
      query += ' AND entity_type = ?';
      params.push(filters.entityType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);
    return rows.map(row => this.mapRowToObject(row));
  }
}

