import { getMySQLConnection } from '../config/database.js';
import { sqlStorefrontProductExclusion } from '../utils/storefrontProductExclusions.js';

export class ProductRepository {
  async findAll(filters = {}, pagination = {}, options = {}) {
    const pool = await getMySQLConnection();
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT id, name, description, technical_specs, price_ht, tva, price_ttc, 
             stock, priority, status, slug, category_id, created_at, updated_at
      FROM products 
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.categoryId) {
      query += ' AND category_id = ?';
      params.push(filters.categoryId);
    }
    if (filters.search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }
    if (filters.inStock !== undefined) {
      if (filters.inStock) {
        query += ' AND stock > 0';
      } else {
        query += ' AND stock = 0';
      }
    }
    if (options.excludeStorefrontHidden) {
      query += sqlStorefrontProductExclusion();
    }
    
    // Tri : priorité décroissante, puis stock > 0 en premier, puis date de création
    query += ' ORDER BY priority DESC, CASE WHEN stock > 0 THEN 0 ELSE 1 END, created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.execute(query, params);
    
    // Compter le total
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const countParams = [];
    if (filters.status) {
      countQuery += ' AND status = ?';
      countParams.push(filters.status);
    }
    if (filters.categoryId) {
      countQuery += ' AND category_id = ?';
      countParams.push(filters.categoryId);
    }
    if (filters.search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      countParams.push(searchTerm, searchTerm);
    }
    if (filters.inStock !== undefined) {
      if (filters.inStock) {
        countQuery += ' AND stock > 0';
      } else {
        countQuery += ' AND stock = 0';
      }
    }
    if (options.excludeStorefrontHidden) {
      countQuery += sqlStorefrontProductExclusion();
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    return {
      data: rows.map(row => this.mapRowToObject(row)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findBySlug(slug) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE slug = ? AND status = ?',
      [slug, 'active']
    );
    return rows[0] ? this.mapRowToObject(rows[0]) : null;
  }

  async findById(id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0] ? this.mapRowToObject(rows[0]) : null;
  }

  async create(productData) {
    const pool = await getMySQLConnection();
    const priceTtc = productData.priceHt * (1 + productData.tva / 100);
    
    const [result] = await pool.execute(`
      INSERT INTO products (
        name, description, technical_specs, price_ht, tva, price_ttc,
        stock, priority, status, slug, category_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      productData.name,
      productData.description,
      JSON.stringify(productData.technicalSpecs || {}),
      productData.priceHt,
      productData.tva,
      priceTtc,
      productData.stock || 0,
      productData.priority || 0,
      productData.status || 'active',
      productData.slug,
      productData.categoryId || null
    ]);
    return this.findById(result.insertId);
  }

  async update(id, productData) {
    const pool = await getMySQLConnection();
    const updates = [];
    const params = [];
    
    if (productData.name !== undefined) {
      updates.push('name = ?');
      params.push(productData.name);
    }
    if (productData.description !== undefined) {
      updates.push('description = ?');
      params.push(productData.description);
    }
    if (productData.technicalSpecs !== undefined) {
      updates.push('technical_specs = ?');
      params.push(JSON.stringify(productData.technicalSpecs));
    }
    if (productData.priceHt !== undefined) {
      updates.push('price_ht = ?');
      params.push(productData.priceHt);
    }
    if (productData.tva !== undefined) {
      updates.push('tva = ?');
      params.push(productData.tva);
    }
    if (productData.stock !== undefined) {
      updates.push('stock = ?');
      params.push(productData.stock);
    }
    if (productData.priority !== undefined) {
      updates.push('priority = ?');
      params.push(productData.priority);
    }
    if (productData.status !== undefined) {
      updates.push('status = ?');
      params.push(productData.status);
    }
    if (productData.slug !== undefined) {
      updates.push('slug = ?');
      params.push(productData.slug);
    }
    if (productData.categoryId !== undefined) {
      updates.push('category_id = ?');
      params.push(productData.categoryId);
    }
    
    // Recalculer le prix TTC si prix HT ou TVA modifiés
    if (productData.priceHt !== undefined || productData.tva !== undefined) {
      const product = await this.findById(id);
      if (product) {
        const newPriceHt = productData.priceHt !== undefined ? productData.priceHt : product.priceHt;
        const newTva = productData.tva !== undefined ? productData.tva : product.tva;
        const newPriceTtc = newPriceHt * (1 + newTva / 100);
        updates.push('price_ttc = ?');
        params.push(newPriceTtc);
      }
    }
    
    if (updates.length === 0) {
      return this.findById(id);
    }
    
    params.push(id);
    await pool.execute(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  async delete(id) {
    const pool = await getMySQLConnection();
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    return true;
  }

  /**
   * Produits actifs visibles vitrine, pour correspondance mots-clés (chatbot local).
   * @param {string[]} tokens mots normalisés (ex. sans accents), longueur >= 2
   * @param {number} limit
   */
  async searchActiveProductsForChatbotTokens(tokens, limit = 8) {
    const safeTokens = (tokens || [])
      .map((t) => String(t).replace(/[%_\\]/g, ''))
      .filter(Boolean);
    if (!safeTokens.length) return [];
    const pool = await getMySQLConnection();
    const exclusion = sqlStorefrontProductExclusion();
    const parts = safeTokens.map(
      () => '(LOWER(name) LIKE ? OR LOWER(COALESCE(description, \'\')) LIKE ?)'
    );
    const whereOr = parts.join(' OR ');
    const params = [];
    for (const safe of safeTokens) {
      const p = `%${safe}%`;
      params.push(p, p);
    }
    params.push(limit);
    const [rows] = await pool.execute(
      `SELECT id, name, description, technical_specs, price_ht, tva, price_ttc,
              stock, priority, status, slug, category_id, created_at, updated_at
       FROM products
       WHERE status = 'active' ${exclusion}
       AND (${whereOr})
       ORDER BY priority DESC, stock > 0 DESC, created_at DESC
       LIMIT ?`,
      params
    );
    return rows.map((row) => this.mapRowToObject(row));
  }

  async findTopProducts(limit = 50) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      `SELECT * FROM products
       WHERE priority > 0
       ORDER BY priority DESC, created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows.map((row) => this.mapRowToObject(row));
  }

  async getMaxPriority() {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute('SELECT COALESCE(MAX(priority), 0) AS max_priority FROM products');
    return Number(rows[0]?.max_priority || 0);
  }

  async setPriority(productId, priority) {
    const pool = await getMySQLConnection();
    await pool.execute('UPDATE products SET priority = ? WHERE id = ?', [priority, productId]);
    return this.findById(productId);
  }

  /**
   * Diminue le stock après commande validée (quantité vendue).
   * @returns {boolean} true si au moins une ligne a été mise à jour
   */
  async decrementStock(productId, quantity) {
    const q = Math.max(0, parseInt(String(quantity), 10) || 0);
    if (q <= 0) return true;
    const pool = await getMySQLConnection();
    const [result] = await pool.execute(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
      [q, productId, q]
    );
    return result.affectedRows > 0;
  }

  mapRowToObject(row) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      technicalSpecs: typeof row.technical_specs === 'string' 
        ? JSON.parse(row.technical_specs) 
        : row.technical_specs,
      priceHt: parseFloat(row.price_ht),
      tva: parseFloat(row.tva),
      priceTtc: parseFloat(row.price_ttc),
      stock: row.stock,
      priority: row.priority,
      status: row.status,
      slug: row.slug,
      categoryId: row.category_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

