import { getMySQLConnection } from '../config/database.js';

export class CartRepository {
  mapRowToObject(row) {
    return {
      id: row.id,
      userId: row.user_id,
      guestToken: row.guest_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  mapItemRowToObject(row) {
    return {
      id: row.id,
      cartId: row.cart_id,
      productId: row.product_id,
      quantity: row.quantity,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Trouver ou créer un panier utilisateur
  async findOrCreateUserCart(userId) {
    const pool = await getMySQLConnection();
    
    // Chercher un panier existant
    const [rows] = await pool.execute(
      'SELECT * FROM carts WHERE user_id = ?',
      [userId]
    );

    if (rows.length > 0) {
      return this.mapRowToObject(rows[0]);
    }

    // Créer un nouveau panier
    const [result] = await pool.execute(
      'INSERT INTO carts (user_id) VALUES (?)',
      [userId]
    );

    return this.findById(result.insertId);
  }

  // Trouver ou créer un panier invité
  async findOrCreateGuestCart(guestToken) {
    const pool = await getMySQLConnection();
    
    // Chercher un panier existant
    const [rows] = await pool.execute(
      'SELECT * FROM carts WHERE guest_token = ?',
      [guestToken]
    );

    if (rows.length > 0) {
      return this.mapRowToObject(rows[0]);
    }

    // Créer un nouveau panier
    const [result] = await pool.execute(
      'INSERT INTO carts (guest_token) VALUES (?)',
      [guestToken]
    );

    return this.findById(result.insertId);
  }

  // Trouver un panier par ID
  async findById(cartId) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM carts WHERE id = ?',
      [cartId]
    );

    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  // Trouver un panier par userId
  async findByUserId(userId) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM carts WHERE user_id = ?',
      [userId]
    );

    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  // Trouver un panier par guestToken
  async findByGuestToken(guestToken) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM carts WHERE guest_token = ?',
      [guestToken]
    );

    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  // Convertir un panier invité en panier utilisateur
  async convertGuestToUserCart(guestToken, userId) {
    const pool = await getMySQLConnection();
    
    // Trouver le panier invité
    const guestCart = await this.findByGuestToken(guestToken);
    if (!guestCart) {
      return null;
    }

    // Vérifier si l'utilisateur a déjà un panier
    const userCart = await this.findByUserId(userId);
    
    if (userCart) {
      // Fusionner les items du panier invité dans le panier utilisateur
      // Retourner le panier utilisateur (la fusion sera faite dans le service)
      return userCart;
    } else {
      // Convertir le panier invité en panier utilisateur
      await pool.execute(
        'UPDATE carts SET user_id = ?, guest_token = NULL WHERE id = ?',
        [userId, guestCart.id]
      );
      
      return this.findById(guestCart.id);
    }
  }

  // Obtenir tous les items d'un panier
  async getCartItems(cartId) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM cart_items WHERE cart_id = ? ORDER BY created_at ASC',
      [cartId]
    );

    return rows.map(row => this.mapItemRowToObject(row));
  }

  // Ajouter un produit au panier
  async addItem(cartId, productId, quantity) {
    const pool = await getMySQLConnection();
    
    // Vérifier si l'item existe déjà
    const [existing] = await pool.execute(
      'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, productId]
    );

    if (existing.length > 0) {
      // Mettre à jour la quantité
      const newQuantity = existing[0].quantity + quantity;
      await pool.execute(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, existing[0].id]
      );
      return this.getItemById(existing[0].id);
    } else {
      // Créer un nouvel item
      const [result] = await pool.execute(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
        [cartId, productId, quantity]
      );
      return this.getItemById(result.insertId);
    }
  }

  // Mettre à jour la quantité d'un item
  async updateItemQuantity(cartId, productId, quantity) {
    const pool = await getMySQLConnection();
    
    if (quantity <= 0) {
      // Supprimer l'item si la quantité est 0 ou négative
      await this.removeItem(cartId, productId);
      return null;
    }

    const [result] = await pool.execute(
      'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ? AND product_id = ?',
      [quantity, cartId, productId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Item du panier introuvable');
    }

    const [rows] = await pool.execute(
      'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, productId]
    );

    return rows.length > 0 ? this.mapItemRowToObject(rows[0]) : null;
  }

  // Supprimer un item du panier
  async removeItem(cartId, productId) {
    const pool = await getMySQLConnection();
    const [result] = await pool.execute(
      'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, productId]
    );

    return result.affectedRows > 0;
  }

  // Obtenir un item par ID
  async getItemById(itemId) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM cart_items WHERE id = ?',
      [itemId]
    );

    return rows.length > 0 ? this.mapItemRowToObject(rows[0]) : null;
  }

  // Vider le panier
  async clearCart(cartId) {
    const pool = await getMySQLConnection();
    await pool.execute(
      'DELETE FROM cart_items WHERE cart_id = ?',
      [cartId]
    );
  }

  // Supprimer un panier (et tous ses items via CASCADE)
  async deleteCart(cartId) {
    const pool = await getMySQLConnection();
    await pool.execute(
      'DELETE FROM carts WHERE id = ?',
      [cartId]
    );
  }
}

