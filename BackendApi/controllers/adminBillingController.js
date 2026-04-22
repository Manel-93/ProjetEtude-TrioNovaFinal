import fs from 'fs';
import { OrderRepository } from '../repositories/orderRepository.js';
import { InvoiceRepository } from '../repositories/invoiceRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { InvoiceService } from '../services/invoiceService.js';
import { EmailService } from '../services/emailService.js';

export class AdminBillingController {
  constructor() {
    this.orderRepository = new OrderRepository();
    this.invoiceRepository = new InvoiceRepository();
    this.userRepository = new UserRepository();
    this.invoiceService = new InvoiceService();
    this.emailService = new EmailService();
  }

  downloadInvoicePdf = async (req, res, next) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: { message: 'Commande introuvable' } });
      }
      const invoice = await this.invoiceRepository.findByOrderId(orderId);
      if (!invoice) {
        return res.status(404).json({ success: false, error: { message: 'Facture introuvable' } });
      }
      let pdfPath = invoice.pdfPath;
      if (!pdfPath || !fs.existsSync(pdfPath)) {
        pdfPath = await this.invoiceService.generateInvoicePDF(invoice.id);
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="facture_${invoice.invoiceNumber}.pdf"`);
      fs.createReadStream(pdfPath).pipe(res);
    } catch (error) {
      next(error);
    }
  };

  sendInvoiceEmail = async (req, res, next) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: { message: 'Commande introuvable' } });
      }
      if (!order.userId) {
        return res.status(400).json({ success: false, error: { message: 'Commande invitée : aucun email utilisateur' } });
      }
      const user = await this.userRepository.findById(order.userId);
      const invoice = await this.invoiceRepository.findByOrderId(orderId);
      if (!user?.email || !invoice) {
        return res.status(404).json({ success: false, error: { message: 'Utilisateur ou facture introuvable' } });
      }
      let pdfPath = invoice.pdfPath;
      if (!pdfPath || !fs.existsSync(pdfPath)) {
        pdfPath = await this.invoiceService.generateInvoicePDF(invoice.id);
      }
      await this.emailService.sendInvoiceEmail(user.email, user.first_name || '', invoice.invoiceNumber, pdfPath);
      res.status(200).json({ success: true, message: 'Facture envoyée par email' });
    } catch (error) {
      next(error);
    }
  };

  createCreditNote = async (req, res, next) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      const { reason, amount } = req.body || {};
      const invoice = await this.invoiceRepository.findByOrderId(orderId);
      if (!invoice) {
        return res.status(404).json({ success: false, error: { message: 'Facture introuvable pour cette commande' } });
      }
      const creditNoteId = await this.invoiceService.createCreditNote(invoice.id, {
        reason: reason || 'Annulation / correction manuelle',
        amount: amount || invoice.total
      });
      res.status(200).json({
        success: true,
        data: { creditNoteId },
        message: 'Avoir généré avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  createAutomaticCreditNote = async (req, res, next) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      const { triggerType, reason, amount } = req.body || {};
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: { message: 'Commande introuvable' } });
      }
      const creditNoteId = await this.invoiceService.createAutomaticCreditNoteByOrder(orderId, triggerType, {
        reason,
        amount,
        source: 'backoffice.automatic'
      });
      res.status(200).json({
        success: true,
        data: { creditNoteId, triggerType },
        message: 'Avoir automatique généré avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  deleteInvoice = async (req, res, next) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      const { reason } = req.body || {};
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: { message: 'Commande introuvable' } });
      }
      const invoice = await this.invoiceRepository.findByOrderId(orderId);
      if (!invoice) {
        return res.status(404).json({ success: false, error: { message: 'Facture introuvable pour cette commande' } });
      }

      const result = await this.invoiceService.deleteInvoiceWithAutoCreditNote(invoice.id, {
        reason: reason || 'Suppression de facture depuis le back-office'
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Facture supprimée et avoir généré automatiquement'
      });
    } catch (error) {
      next(error);
    }
  };
}
