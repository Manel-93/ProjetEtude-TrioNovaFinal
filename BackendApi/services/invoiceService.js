import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { InvoiceRepository } from '../repositories/invoiceRepository.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { EmailService } from './emailService.js';
import { getMySQLConnection } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class InvoiceService {
  constructor() {
    this.invoiceRepository = new InvoiceRepository();
    this.orderRepository = new OrderRepository();
    this.userRepository = new UserRepository();
    this.emailService = new EmailService();
    
    // Créer le dossier invoices s'il n'existe pas
    this.invoicesDir = path.join(__dirname, '..', 'invoices');
    if (!fs.existsSync(this.invoicesDir)) {
      fs.mkdirSync(this.invoicesDir, { recursive: true });
    }
  }

  // Créer une facture à partir d'une commande
  async createInvoiceFromOrder(orderId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Commande introuvable');
    }

    // Vérifier si une facture existe déjà
    const existingInvoice = await this.invoiceRepository.findByOrderId(orderId);
    if (existingInvoice) {
      return existingInvoice;
    }

    // Créer la facture
    const invoice = await this.invoiceRepository.create({
      orderId: orderId,
      userId: order.userId,
      subtotal: order.subtotal,
      tva: order.tva,
      total: order.total,
      currency: order.currency,
      status: 'draft',
      metadata: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt
      }
    });

    // Générer le PDF et mettre à jour le statut
    await this.generateInvoicePDF(invoice.id);

    return invoice;
  }

  // Générer le PDF d'une facture
  async generateInvoicePDF(invoiceId) {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Facture introuvable');
    }

    const order = await this.orderRepository.findById(invoice.orderId);
    if (!order) {
      throw new Error('Commande introuvable');
    }

    const items = await this.orderRepository.getOrderItems(invoice.orderId);
    
    let user = null;
    if (invoice.userId) {
      user = await this.userRepository.findById(invoice.userId);
    }

    // Créer le document PDF
    const doc = new PDFDocument({ margin: 50 });
    const filename = `invoice_${invoice.invoiceNumber}.pdf`;
    const filepath = path.join(this.invoicesDir, filename);

    // Stream vers fichier
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // En-tête
    doc.fontSize(20).text('FACTURE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`N° ${invoice.invoiceNumber}`, { align: 'center' });
    doc.moveDown(2);

    // Informations entreprise (à personnaliser)
    doc.fontSize(10)
       .text('TrioNova / AltheSystems', 50, 100)
       .text('Adresse entreprise', 50, 115)
       .text('Code postal Ville', 50, 130)
       .text('Email: contact@trionova.com', 50, 145)
       .text('Tél: +33 X XX XX XX XX', 50, 160);

    // Informations client
    const clientY = 100;
    doc.fontSize(10)
       .text('FACTURÉ À:', 350, clientY, { width: 200, align: 'right' });
    
    if (user) {
      doc.text(`${user.first_name} ${user.last_name}`, 350, clientY + 15, { width: 200, align: 'right' });
      doc.text(user.email, 350, clientY + 30, { width: 200, align: 'right' });
    } else {
      doc.text('Client invité', 350, clientY + 15, { width: 200, align: 'right' });
    }

    if (order.billingAddress) {
      const addr = order.billingAddress;
      if (addr.addressLine1) doc.text(addr.addressLine1, 350, clientY + 45, { width: 200, align: 'right' });
      if (addr.addressLine2) doc.text(addr.addressLine2, 350, clientY + 60, { width: 200, align: 'right' });
      if (addr.postalCode && addr.city) doc.text(`${addr.postalCode} ${addr.city}`, 350, clientY + 75, { width: 200, align: 'right' });
      if (addr.country) doc.text(addr.country, 350, clientY + 90, { width: 200, align: 'right' });
    }

    // Date et commande
    const infoY = clientY + (order.billingAddress ? 120 : 60);
    doc.text(`Date d'émission: ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}`, 50, infoY);
    doc.text(`Commande N°: ${order.orderNumber}`, 50, infoY + 15);

    // Tableau des articles
    let tableY = infoY + 50;
    doc.moveTo(50, tableY).lineTo(550, tableY).stroke();
    
    // En-tête du tableau
    doc.fontSize(10).font('Helvetica-Bold')
       .text('Produit', 50, tableY + 10)
       .text('Qté', 300, tableY + 10)
       .text('Prix unitaire HT', 350, tableY + 10)
       .text('TVA', 450, tableY + 10)
       .text('Total TTC', 480, tableY + 10);
    
    tableY += 30;
    doc.moveTo(50, tableY).lineTo(550, tableY).stroke();
    doc.font('Helvetica');

    // Articles
    for (const item of items) {
      if (tableY > 700) {
        doc.addPage();
        tableY = 50;
      }
      
      doc.fontSize(9)
         .text(item.productName, 50, tableY + 5, { width: 240 })
         .text(item.quantity.toString(), 300, tableY + 5)
         .text(`${item.unitPriceHt.toFixed(2)} €`, 350, tableY + 5)
         .text(`${item.tva.toFixed(2)} %`, 450, tableY + 5)
         .text(`${item.total.toFixed(2)} €`, 480, tableY + 5);
      
      tableY += 25;
    }

    // Totaux
    tableY += 10;
    doc.moveTo(50, tableY).lineTo(550, tableY).stroke();
    tableY += 20;

    doc.fontSize(10)
       .text('Sous-total HT:', 350, tableY, { width: 100, align: 'right' })
       .text(`${invoice.subtotal.toFixed(2)} €`, 480, tableY);
    
    tableY += 20;
    doc.text(`TVA (${items[0]?.tva || 20}%):`, 350, tableY, { width: 100, align: 'right' })
       .text(`${invoice.tva.toFixed(2)} €`, 480, tableY);
    
    tableY += 20;
    doc.moveTo(350, tableY).lineTo(550, tableY).stroke();
    tableY += 10;
    
    doc.fontSize(12).font('Helvetica-Bold')
       .text('Total TTC:', 350, tableY, { width: 100, align: 'right' })
       .text(`${invoice.total.toFixed(2)} €`, 480, tableY);

    // Pied de page
    const footerY = doc.page.height - 50;
    doc.fontSize(8).font('Helvetica')
       .text('Merci pour votre achat !', 50, footerY, { align: 'center', width: 500 });

    // Finaliser le PDF
    doc.end();

    // Attendre que le stream soit terminé
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Mettre à jour la facture avec le chemin du PDF et le statut
    await this.invoiceRepository.updateStatus(invoiceId, 'issued', filepath);

    return filepath;
  }

  // Récupérer une facture par ID
  async getInvoiceById(invoiceId, userId = null) {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Facture introuvable');
    }

    // Vérifier que l'utilisateur peut accéder à cette facture
    if (userId) {
      // Si l'utilisateur est connecté, vérifier qu'il est propriétaire
      // Si invoice.userId correspond, autoriser
      if (invoice.userId && invoice.userId === userId) {
        return invoice;
      }
      
      // Si invoice.userId est null ou différent, vérifier via la commande associée
      if (invoice.orderId) {
        try {
          const order = await this.orderRepository.findById(invoice.orderId);
          // Si la commande appartient à l'utilisateur connecté, autoriser
          if (order && order.userId === userId) {
            return invoice;
          }
          // Si la commande n'appartient pas à l'utilisateur, refuser
          if (order && order.userId && order.userId !== userId) {
            throw new Error('Accès non autorisé à cette facture');
          }
        } catch (error) {
          if (error.message === 'Accès non autorisé à cette facture') {
            throw error;
          }
          console.warn('⚠️ Could not verify order for invoice access:', error.message);
        }
      }
      
      // Si invoice.userId existe mais est différent de userId, refuser
      if (invoice.userId && invoice.userId !== userId) {
        throw new Error('Accès non autorisé à cette facture');
      }
      
      // Si on arrive ici, invoice.userId est null et on n'a pas pu vérifier via la commande
      // Autoriser par défaut si userId est fourni (l'utilisateur est authentifié)
      return invoice;
    } else {
      // Si l'utilisateur n'est pas connecté, autoriser seulement si invoice.userId est aussi null (invité)
      if (invoice.userId !== null) {
        throw new Error('Authentification requise pour accéder à cette facture');
      }
      return invoice;
    }
  }

  // Récupérer une facture par commande
  async getInvoiceByOrderId(orderId) {
    return await this.invoiceRepository.findByOrderId(orderId);
  }

  // Récupérer le PDF d'une facture
  async getInvoicePDF(invoiceId, userId = null) {
    const invoice = await this.getInvoiceById(invoiceId, userId);
    
    if (!invoice.pdfPath || !fs.existsSync(invoice.pdfPath)) {
      // Régénérer le PDF s'il n'existe pas
      await this.generateInvoicePDF(invoiceId);
      const updatedInvoice = await this.invoiceRepository.findById(invoiceId);
      return updatedInvoice.pdfPath;
    }

    return invoice.pdfPath;
  }

  // Créer un avoir (credit note)
  async createCreditNote(invoiceId, creditNoteData) {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Facture introuvable');
    }

    if (invoice.status !== 'issued') {
      throw new Error('Seules les factures émises peuvent être annulées');
    }

    const order = await this.orderRepository.findById(invoice.orderId);
    
    const creditNoteId = await this.invoiceRepository.createCreditNote({
      invoiceId: invoiceId,
      orderId: invoice.orderId,
      userId: invoice.userId,
      amount: creditNoteData.amount || invoice.total,
      currency: invoice.currency,
      reason: creditNoteData.reason || 'Annulation de commande',
      status: 'draft'
    });

    // Générer le PDF de l'avoir
    await this.generateCreditNotePDF(creditNoteId);

    // Mettre à jour le statut de la facture
    await this.invoiceRepository.updateStatus(invoiceId, 'canceled');

    return creditNoteId;
  }

  // Générer le PDF d'un avoir
  async generateCreditNotePDF(creditNoteId) {
    const creditNote = await this.invoiceRepository.findCreditNoteById(creditNoteId);
    if (!creditNote) {
      throw new Error('Avoir introuvable');
    }

    const invoice = await this.invoiceRepository.findById(creditNote.invoiceId);
    const order = await this.orderRepository.findById(creditNote.orderId);
    
    let user = null;
    if (creditNote.userId) {
      user = await this.userRepository.findById(creditNote.userId);
    }

    // Créer le document PDF
    const doc = new PDFDocument({ margin: 50 });
    const filename = `credit_note_${creditNote.creditNoteNumber}.pdf`;
    const filepath = path.join(this.invoicesDir, filename);

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // En-tête
    doc.fontSize(20).text('AVOIR', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`N° ${creditNote.creditNoteNumber}`, { align: 'center' });
    doc.moveDown(2);

    // Informations
    doc.fontSize(10)
       .text('TrioNova / AltheSystems', 50, 100)
       .text(`Date d'émission: ${new Date(creditNote.createdAt).toLocaleDateString('fr-FR')}`, 50, 130)
       .text(`Facture N°: ${invoice.invoiceNumber}`, 50, 145)
       .text(`Commande N°: ${order.orderNumber}`, 50, 160);

    if (user) {
      doc.text(`Client: ${user.first_name} ${user.last_name}`, 50, 175);
    }

    // Motif
    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica-Bold').text('Motif:', 50);
    doc.fontSize(10).font('Helvetica').text(creditNote.reason || 'Non spécifié', 50);

    // Montant
    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica-Bold').text('Montant remboursé:', 50);
    doc.fontSize(14).font('Helvetica-Bold')
       .text(`${creditNote.amount.toFixed(2)} ${creditNote.currency}`, 50);

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Mettre à jour l'avoir avec le chemin du PDF
    const pool = await getMySQLConnection();
    await pool.execute(
      'UPDATE credit_notes SET pdf_path = ?, status = ?, issued_at = CURRENT_TIMESTAMP WHERE id = ?',
      [filepath, 'issued', creditNoteId]
    );

    return filepath;
  }
}

