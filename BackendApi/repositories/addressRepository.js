import { getMySQLConnection } from '../config/database.js';

export class AddressRepository {
  async create(addressData) {
    const pool = await getMySQLConnection();
    const [result] = await pool.execute(`
      INSERT INTO addresses (
        user_id, type, is_default, first_name, last_name, company,
        address_line1, address_line2, city, postal_code, country, phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      addressData.userId,
      addressData.type,
      addressData.isDefault || false,
      addressData.firstName,
      addressData.lastName,
      addressData.company || null,
      addressData.addressLine1,
      addressData.addressLine2 || null,
      addressData.city,
      addressData.postalCode,
      addressData.country,
      addressData.phone || null
    ]);
    return this.findById(result.insertId);
  }

  async findByUserId(userId, type = null) {
    const pool = await getMySQLConnection();
    let query = `
      SELECT * FROM addresses 
      WHERE user_id = ?
    `;
    const params = [userId];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY is_default DESC, created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows.map(row => this.mapRowToObject(row));
  }

  async findById(id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute('SELECT * FROM addresses WHERE id = ?', [id]);
    return rows[0] ? this.mapRowToObject(rows[0]) : null;
  }

  async findByUserIdAndId(userId, id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM addresses WHERE user_id = ? AND id = ?',
      [userId, id]
    );
    return rows[0] ? this.mapRowToObject(rows[0]) : null;
  }

  async update(id, addressData) {
    const pool = await getMySQLConnection();
    const updates = [];
    const params = [];
    
    if (addressData.firstName !== undefined) {
      updates.push('first_name = ?');
      params.push(addressData.firstName);
    }
    if (addressData.lastName !== undefined) {
      updates.push('last_name = ?');
      params.push(addressData.lastName);
    }
    if (addressData.company !== undefined) {
      updates.push('company = ?');
      params.push(addressData.company);
    }
    if (addressData.addressLine1 !== undefined) {
      updates.push('address_line1 = ?');
      params.push(addressData.addressLine1);
    }
    if (addressData.addressLine2 !== undefined) {
      updates.push('address_line2 = ?');
      params.push(addressData.addressLine2);
    }
    if (addressData.city !== undefined) {
      updates.push('city = ?');
      params.push(addressData.city);
    }
    if (addressData.postalCode !== undefined) {
      updates.push('postal_code = ?');
      params.push(addressData.postalCode);
    }
    if (addressData.country !== undefined) {
      updates.push('country = ?');
      params.push(addressData.country);
    }
    if (addressData.phone !== undefined) {
      updates.push('phone = ?');
      params.push(addressData.phone);
    }
    
    if (updates.length === 0) {
      return this.findById(id);
    }
    
    params.push(id);
    await pool.execute(
      `UPDATE addresses SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  async setDefault(userId, addressId, type) {
    const pool = await getMySQLConnection();
    
    // Retirer le statut default de tous les autres du même type
    await pool.execute(
      'UPDATE addresses SET is_default = FALSE WHERE user_id = ? AND type = ? AND id != ?',
      [userId, type, addressId]
    );
    
    // Définir celui-ci comme default
    await pool.execute(
      'UPDATE addresses SET is_default = TRUE WHERE user_id = ? AND type = ? AND id = ?',
      [userId, type, addressId]
    );
    
    return this.findById(addressId);
  }

  async delete(userId, id) {
    const pool = await getMySQLConnection();
    await pool.execute('DELETE FROM addresses WHERE user_id = ? AND id = ?', [userId, id]);
    return true;
  }

  async deleteByUserId(userId) {
    const pool = await getMySQLConnection();
    await pool.execute('DELETE FROM addresses WHERE user_id = ?', [userId]);
    return true;
  }

  // Mapper les colonnes SQL vers les noms camelCase
  mapRowToObject(row) {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      isDefault: row.is_default === 1 || row.is_default === true,
      firstName: row.first_name,
      lastName: row.last_name,
      company: row.company,
      addressLine1: row.address_line1,
      addressLine2: row.address_line2,
      city: row.city,
      postalCode: row.postal_code,
      country: row.country,
      phone: row.phone,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

