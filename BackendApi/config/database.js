import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MySQL connexion
let mysqlPool = null;

export const getMySQLConnection = async () => {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'trio_nova_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return mysqlPool;
};

// MongoDB connexion avec Mongoose
let isMongoConnected = false;

export const connectMongoDB = async () => {
  if (isMongoConnected) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trio_nova_db';
  
  // Options de connexion
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
    w: 'majority'
  };

  try {
    await mongoose.connect(mongoUri, options);
    isMongoConnected = true;
    
    // Gestion des evenements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isMongoConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      isMongoConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isMongoConnected = true;
    });

    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    isMongoConnected = false;
    throw error;
  }
};

export const getMongoConnection = async () => {
  return await connectMongoDB();
};

// Initialisation des bases de donnees
export const initializeDatabases = async () => {
  try {
    // MySQL - Creation de la table users
    const mysqlPool = await getMySQLConnection();
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role ENUM('USER', 'ADMIN') DEFAULT 'USER',
        is_email_confirmed BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_email_confirmed (is_email_confirmed),
        INDEX idx_role (role),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Migration : Ajouter les colonnes si elles n'existent pas
    try {
      const [columns] = await mysqlPool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      `, [process.env.MYSQL_DATABASE || 'trio_nova_db']);
      
      const existingColumns = columns.map(col => col.COLUMN_NAME);
      
      if (!existingColumns.includes('phone')) {
        await mysqlPool.execute(`ALTER TABLE users ADD COLUMN phone VARCHAR(20)`);
      }
      if (!existingColumns.includes('role')) {
        await mysqlPool.execute(`ALTER TABLE users ADD COLUMN role ENUM('USER', 'ADMIN') DEFAULT 'USER'`);
      }
      if (!existingColumns.includes('is_active')) {
        await mysqlPool.execute(`ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE`);
      }
    } catch (error) {
      console.warn('Migration warning:', error.message);
    }

    // Création de la table addresses
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('billing', 'shipping') NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        company VARCHAR(100),
        address_line1 VARCHAR(200) NOT NULL,
        address_line2 VARCHAR(200),
        city VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_user_type (user_id, type),
        INDEX idx_user_type_default (user_id, type, is_default)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table payment_methods
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        stripe_customer_id VARCHAR(255) NOT NULL,
        stripe_payment_method_id VARCHAR(255) NOT NULL,
        type ENUM('card', 'bank_account') DEFAULT 'card',
        is_default BOOLEAN DEFAULT FALSE,
        last4 VARCHAR(4),
        brand VARCHAR(50),
        expiry_month INT,
        expiry_year INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_stripe_customer_id (stripe_customer_id),
        INDEX idx_user_default (user_id, is_default)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table categories
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        parent_id INT NULL,
        display_order INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        slug VARCHAR(200) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_slug (slug),
        INDEX idx_status (status),
        INDEX idx_parent_id (parent_id),
        INDEX idx_display_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Migration : Ajouter parent_id si elle n'existe pas
    try {
      const [columns] = await mysqlPool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'parent_id'
      `, [process.env.MYSQL_DATABASE || 'trio_nova_db']);
      
      if (columns.length === 0) {
        await mysqlPool.execute(`ALTER TABLE categories ADD COLUMN parent_id INT NULL`);
        await mysqlPool.execute(`ALTER TABLE categories ADD FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL`);
        await mysqlPool.execute(`ALTER TABLE categories ADD INDEX idx_parent_id (parent_id)`);
      }
    } catch (error) {
      console.warn('Migration categories warning:', error.message);
    }

    // Migration : image de couverture catégorie (URL absolue)
    try {
      const [imgCols] = await mysqlPool.execute(
        `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'image_url'
        `,
        [process.env.MYSQL_DATABASE || 'trio_nova_db']
      );
      if (imgCols.length === 0) {
        await mysqlPool.execute(
          `ALTER TABLE categories ADD COLUMN image_url VARCHAR(2048) NULL DEFAULT NULL AFTER slug`
        );
      }
    } catch (error) {
      console.warn('Migration categories image_url warning:', error.message);
    }

    // Création de la table products
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        technical_specs JSON,
        price_ht DECIMAL(10, 2) NOT NULL,
        tva DECIMAL(5, 2) DEFAULT 20.00,
        price_ttc DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        priority INT DEFAULT 0,
        status ENUM('active', 'inactive', 'draft') DEFAULT 'active',
        slug VARCHAR(200) UNIQUE NOT NULL,
        category_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_slug (slug),
        INDEX idx_status (status),
        INDEX idx_category_id (category_id),
        INDEX idx_priority (priority),
        INDEX idx_stock (stock),
        INDEX idx_status_priority_stock (status, priority DESC, stock)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table carts
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS carts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        guest_token VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_guest_token (guest_token),
        UNIQUE KEY unique_user_cart (user_id),
        UNIQUE KEY unique_guest_cart (guest_token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Migration : Supprimer les anciennes contraintes UNIQUE si elles existent et recréer
    try {
      const [constraints] = await mysqlPool.execute(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'carts' AND CONSTRAINT_TYPE = 'UNIQUE'
      `, [process.env.MYSQL_DATABASE || 'trio_nova_db']);
      
      // Si les contraintes n'existent pas, les ajouter
      const constraintNames = constraints.map(c => c.CONSTRAINT_NAME);
      
      if (!constraintNames.includes('unique_user_cart')) {
        await mysqlPool.execute(`
          ALTER TABLE carts 
          ADD UNIQUE KEY unique_user_cart (user_id)
        `);
      }
      
      if (!constraintNames.includes('unique_guest_cart')) {
        await mysqlPool.execute(`
          ALTER TABLE carts 
          ADD UNIQUE KEY unique_guest_cart (guest_token)
        `);
      }
    } catch (error) {
      console.warn('Migration carts warning:', error.message);
    }

    // Création de la table cart_items
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_cart_id (cart_id),
        INDEX idx_product_id (product_id),
        UNIQUE KEY unique_cart_product (cart_id, product_id),
        CHECK (quantity > 0)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table payments
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        cart_id INT NULL,
        stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'EUR',
        status ENUM('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded') DEFAULT 'pending',
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_cart_id (cart_id),
        INDEX idx_stripe_payment_intent_id (stripe_payment_intent_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table orders
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        user_id INT NULL,
        payment_id INT NULL,
        cart_id INT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        tva DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'EUR',
        status ENUM('pending', 'processing', 'completed', 'canceled') DEFAULT 'pending',
        shipping_address JSON,
        billing_address JSON,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_payment_id (payment_id),
        INDEX idx_order_number (order_number),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table order_items
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        product_slug VARCHAR(200) NOT NULL,
        quantity INT NOT NULL,
        unit_price_ht DECIMAL(10, 2) NOT NULL,
        unit_price_ttc DECIMAL(10, 2) NOT NULL,
        tva DECIMAL(5, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
        INDEX idx_order_id (order_id),
        INDEX idx_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table order_status_history
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        status ENUM('pending', 'processing', 'completed', 'canceled') NOT NULL,
        changed_by INT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_order_id (order_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table invoices
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        order_id INT NOT NULL,
        user_id INT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        tva DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'EUR',
        status ENUM('draft', 'issued', 'paid', 'canceled') DEFAULT 'draft',
        issued_at TIMESTAMP NULL,
        paid_at TIMESTAMP NULL,
        pdf_path VARCHAR(500),
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_order_id (order_id),
        INDEX idx_user_id (user_id),
        INDEX idx_invoice_number (invoice_number),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table credit_notes
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS credit_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        credit_note_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_id INT NOT NULL,
        order_id INT NOT NULL,
        user_id INT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'EUR',
        reason TEXT,
        status ENUM('draft', 'issued', 'applied') DEFAULT 'draft',
        issued_at TIMESTAMP NULL,
        pdf_path VARCHAR(500),
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_invoice_id (invoice_id),
        INDEX idx_order_id (order_id),
        INDEX idx_user_id (user_id),
        INDEX idx_credit_note_number (credit_note_number),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table admin_2fa (2FA pour les administrateurs)
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS admin_2fa (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        secret VARCHAR(255) NOT NULL,
        is_enabled BOOLEAN DEFAULT FALSE,
        backup_codes JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_2fa (user_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table contact_messages (messages de contact)
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(200),
        message TEXT NOT NULL,
        status ENUM('pending', 'in_progress', 'resolved', 'archived') DEFAULT 'pending',
        user_id INT NULL,
        assigned_to INT NULL,
        resolved_at TIMESTAMP NULL,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_status (status),
        INDEX idx_user_id (user_id),
        INDEX idx_assigned_to (assigned_to),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Carrousel page d'accueil (admin + vitrine)
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS home_carousel_slides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NULL,
        image_url VARCHAR(2048) NULL,
        link_url VARCHAR(2048) NULL,
        title VARCHAR(500) NULL,
        subtitle VARCHAR(1000) NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        INDEX idx_active_sort (active, sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table admin_activity_logs (logs d'activité admin)
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS admin_activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INT,
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_admin_id (admin_id),
        INDEX idx_action (action),
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ MySQL database initialized');
  } catch (error) {
    console.error('❌ MySQL initialization error:', error.message);
    throw error;
  }

  try {
    // MongoDB - Connexion
    const mongoConnection = await connectMongoDB();
    const dbName = mongoConnection.db.databaseName;
  
    await import('../models/Token.js');
    await import('../models/LoginHistory.js');
    await import('../models/ProductImage.js');
    
    console.log(`✅ MongoDB connected (database: ${dbName})`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    if (error.message.includes('whitelist') || error.message.includes('IP')) {
      console.error('\n⚠️  SOLUTION: Ajoutez votre IP actuelle à la whitelist MongoDB Atlas:');
      console.error('   1. Connectez-vous à https://cloud.mongodb.com/');
      console.error('   2. Allez dans "Network Access"');
      console.error('   3. Cliquez sur "Add IP Address"');
      console.error('   4. Ajoutez votre IP actuelle ou utilisez "0.0.0.0/0" pour autoriser toutes les IPs (développement uniquement)');
      console.error('   5. Attendez quelques minutes que les changements soient appliqués\n');
    }
    
    // En développement, on peut continuer sans MongoDB (mais certaines fonctionnalités ne fonctionneront pas)
    if (process.env.NODE_ENV === 'development' && process.env.ALLOW_NO_MONGODB === 'true') {
      console.warn('⚠️  Mode développement: Le serveur continue sans MongoDB (fonctionnalités limitées)');
      return;
    }
    
    throw error;
  }

  // Initialisation Elasticsearch (optionnel)
  if (process.env.ELASTICSEARCH_NODE && process.env.ELASTICSEARCH_NODE !== 'false') {
    try {
      const { initializeElasticsearchIndex, testElasticsearchConnection } = await import('./elasticsearch.js');
      await testElasticsearchConnection();
      await initializeElasticsearchIndex();
      console.log('✅ Elasticsearch initialized and connected');
    } catch (error) {
      console.error('❌ Elasticsearch initialization error:', error.message);
      
      if (process.env.ALLOW_NO_ELASTICSEARCH === 'true') {
        console.warn('⚠️  Continuing without Elasticsearch (search functionality will be limited)');
        console.error('\n📋 Pour démarrer Elasticsearch:');
        console.error('   1. Avec Docker (recommandé):');
        console.error('      docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 \\');
        console.error('        -e "discovery.type=single-node" \\');
        console.error('        -e "xpack.security.enabled=false" \\');
        console.error('        elasticsearch:8.11.0');
        console.error('   2. Vérifier que Elasticsearch fonctionne:');
        console.error('      curl http://localhost:9200');
        console.error('   3. Redémarrer le serveur après le démarrage d\'Elasticsearch\n');
      } else {
        console.error('⚠️  Elasticsearch is optional. Set ALLOW_NO_ELASTICSEARCH=true in .env to continue without it.');
        console.error('\n📋 Pour démarrer Elasticsearch rapidement:');
        console.error('   docker run -d --name elasticsearch -p 9200:9200 -e "discovery.type=single-node" -e "xpack.security.enabled=false" elasticsearch:8.11.0\n');
      }
    }
  } else {
    console.log('ℹ️  Elasticsearch not configured (ELASTICSEARCH_NODE not set or is false)');
  }
};

