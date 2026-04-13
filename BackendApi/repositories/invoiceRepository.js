import { getMySQLConnection } from '../config/database.js';

export class InvoiceRepository {
  mapRowToObject(row) {
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      orderId: row.order_id,
      userId: row.user_id,
      subtotal: parseFloat(row.subtotal),
      tva: parseFloat(row.tva),
      total: parseFloat(row.total),
      currency: row.currency,
      status: row.status,
      issuedAt: row.issued_at,
      paidAt: row.paid_at,
      pdfPath: row.pdf_path,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Générer un numéro de facture unique
  async generateInvoiceNumber() {
    const pool = await getMySQLConnection();
    const year = new Date().getFullYear();
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM invoices WHERE YEAR(created_at) = ?',
      [year]
    );
    const sequence = (rows[0].count || 0) + 1;
    return `FAC-${year}-${sequence.toString().padStart(6, '0')}`;
  }

  // Créer une facture
  async create(invoiceData) {
    const pool = await getMySQLConnection();
    const invoiceNumber = await this.generateInvoiceNumber();
    
    const [result] = await pool.execute(
      `INSERT INTO invoices (
        invoice_number, order_id, user_id, subtotal, tva, total,
        currency, status, issued_at, pdf_path, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber,
        invoiceData.orderId,
        invoiceData.userId || null,
        invoiceData.subtotal,
        invoiceData.tva,
        invoiceData.total,
        invoiceData.currency || 'EUR',
        invoiceData.status || 'draft',
        invoiceData.issuedAt || null,
        invoiceData.pdfPath || null,
        invoiceData.metadata ? JSON.stringify(invoiceData.metadata) : null
      ]
    );

    return this.findById(result.insertId);
  }

  // Trouver une facture par ID
  async findById(id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM invoices WHERE id = ?',
      [id]
    );

    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  // Trouver une facture par numéro
  async findByInvoiceNumber(invoiceNumber) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM invoices WHERE invoice_number = ?',
      [invoiceNumber]
    );

    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  // Trouver une facture par commande
  async findByOrderId(orderId) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM invoices WHERE order_id = ?',
      [orderId]
    );

    return rows.length > 0 ? this.mapRowToObject(rows[0]) : null;
  }

  // Trouver les factures d'un utilisateur
  async findByUserId(userId, limit = 50, offset = 0) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );

    return rows.map(row => this.mapRowToObject(row));
  }

  // Mettre à jour le statut d'une facture
  async updateStatus(invoiceId, status, pdfPath = null) {
    const pool = await getMySQLConnection();
    const updateFields = ['status = ?'];
    const params = [status];

    if (status === 'issued' && !pdfPath) {
      updateFields.push('issued_at = CURRENT_TIMESTAMP');
    }
    if (status === 'paid') {
      updateFields.push('paid_at = CURRENT_TIMESTAMP');
    }
    if (pdfPath) {
      updateFields.push('pdf_path = ?');
      params.push(pdfPath);
    }

    params.push(invoiceId);

    await pool.execute(
      `UPDATE invoices SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    return this.findById(invoiceId);
  }

  // Créer un avoir
  async createCreditNote(creditNoteData) {
    const pool = await getMySQLConnection();
    const year = new Date().getFullYear();
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM credit_notes WHERE YEAR(created_at) = ?',
      [year]
    );
    const sequence = (rows[0].count || 0) + 1;
    const creditNoteNumber = `AVO-${year}-${sequence.toString().padStart(6, '0')}`;
    
    const [result] = await pool.execute(
      `INSERT INTO credit_notes (
        credit_note_number, invoice_id, order_id, user_id, amount,
        currency, reason, status, issued_at, pdf_path, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        creditNoteNumber,
        creditNoteData.invoiceId,
        creditNoteData.orderId,
        creditNoteData.userId || null,
        creditNoteData.amount,
        creditNoteData.currency || 'EUR',
        creditNoteData.reason || null,
        creditNoteData.status || 'draft',
        creditNoteData.issuedAt || null,
        creditNoteData.pdfPath || null,
        creditNoteData.metadata ? JSON.stringify(creditNoteData.metadata) : null
      ]
    );

    return result.insertId;
  }

  // Trouver un avoir par ID
  async findCreditNoteById(id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM credit_notes WHERE id = ?',
      [id]
    );

    return rows.length > 0 ? {
      id: rows[0].id,
      creditNoteNumber: rows[0].credit_note_number,
      invoiceId: rows[0].invoice_id,
      orderId: rows[0].order_id,
      userId: rows[0].user_id,
      amount: parseFloat(rows[0].amount),
      currency: rows[0].currency,
      reason: rows[0].reason,
      status: rows[0].status,
      issuedAt: rows[0].issued_at,
      pdfPath: rows[0].pdf_path,
      metadata: rows[0].metadata ? (typeof rows[0].metadata === 'string' ? JSON.parse(rows[0].metadata) : rows[0].metadata) : null,
      createdAt: rows[0].created_at,
      updatedAt: rows[0].updated_at
    } : null;
  }
}

