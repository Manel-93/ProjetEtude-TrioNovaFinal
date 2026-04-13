import { getMySQLConnection } from '../config/database.js';

export class ContactMessageRepository {
  mapRowToObject(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      subject: row.subject,
      message: row.message,
      status: row.status,
      userId: row.user_id,
      assignedTo: row.assigned_to,
      resolvedAt: row.resolved_at,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async create(messageData) {
    const pool = await getMySQLConnection();
    const [result] = await pool.execute(
      `INSERT INTO contact_messages (name, email, subject, message, user_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        messageData.name,
        messageData.email,
        messageData.subject || null,
        messageData.message,
        messageData.userId || null,
        messageData.metadata ? JSON.stringify(messageData.metadata) : null
      ]
    );
    return this.findById(result.insertId);
  }

  async findById(id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM contact_messages WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  async findAll(filters = {}, pagination = {}) {
    const pool = await getMySQLConnection();
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM contact_messages WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.assignedTo) {
      query += ' AND assigned_to = ?';
      params.push(filters.assignedTo);
    }
    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }

    // Tri
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);
    return rows.map(row => this.mapRowToObject(row));
  }

  async updateStatus(id, status, assignedTo = null) {
    const pool = await getMySQLConnection();
    const updates = ['status = ?'];
    const params = [status];

    if (assignedTo !== null) {
      updates.push('assigned_to = ?');
      params.push(assignedTo);
    }

    if (status === 'resolved') {
      updates.push('resolved_at = CURRENT_TIMESTAMP');
    } else if (status !== 'resolved') {
      updates.push('resolved_at = NULL');
    }

    params.push(id);
    await pool.execute(
      `UPDATE contact_messages SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  async countByStatus() {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT status, COUNT(*) as count FROM contact_messages GROUP BY status'
    );
    return rows.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});
  }
}

