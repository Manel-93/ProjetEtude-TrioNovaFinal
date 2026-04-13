import fs from 'fs';
import { InvoiceService } from '../services/invoiceService.js';

export class InvoiceController {
  constructor() {
    this.invoiceService = new InvoiceService();
  }

  // Récupérer le PDF d'une facture
  getInvoicePDF = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId || null;
      
      const pdfPath = await this.invoiceService.getInvoicePDF(parseInt(id), userId);
      
      if (!fs.existsSync(pdfPath)) {
        return res.status(404).json({
          success: false,
          error: { message: 'PDF de facture introuvable' }
        });
      }

      // Envoyer le PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="facture_${id}.pdf"`);
      
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  };
}

