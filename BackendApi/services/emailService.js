import { emailTransporter, emailFrom } from '../config/email.js';

export class EmailService {
  getStorefrontUrl(baseUrl) {
    return (
      process.env.STOREFRONT_URL ||
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      baseUrl
    ).replace(/\/$/, '');
  }

  async sendEmailConfirmation(email, token, baseUrl) {
    const storefrontUrl = this.getStorefrontUrl(baseUrl);
    const confirmUrl = `${storefrontUrl}/connexion?confirmation=${encodeURIComponent(token)}`;
    
    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: 'Confirmation de votre compte TrioNova',
      html: `
        <h2>Bienvenue sur TrioNova !</h2>
        <p>Merci de vous être inscrit. Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>
        <p><a href="${confirmUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirmer mon email</a></p>
        <p>Ou copiez ce lien dans votre navigateur :</p>
        <p>${confirmUrl}</p>
        <p>Ce lien expire dans 24 heures.</p>
      `
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email de confirmation');
    }
  }

  async sendPasswordReset(email, token, baseUrl) {
    const storefrontUrl = this.getStorefrontUrl(baseUrl);
    const resetUrl = `${storefrontUrl}/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;
    
    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: 'Réinitialisation de votre mot de passe TrioNova',
      html: `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
        <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a></p>
        <p>Ou copiez ce lien dans votre navigateur :</p>
        <p>${resetUrl}</p>
        <p>Ce lien expire dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      `
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email de réinitialisation');
    }
  }

  async sendPasswordResetConfirmation(email, firstName) {
    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: 'Votre mot de passe a été réinitialisé - TrioNova',
      html: `
        <h2>Mot de passe réinitialisé</h2>
        <p>Bonjour ${firstName},</p>
        <p>Votre mot de passe a été réinitialisé par un administrateur.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, veuillez contacter le support immédiatement.</p>
        <p>Cordialement,<br>L'équipe TrioNova</p>
      `
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email de confirmation');
    }
  }

  async sendInvoiceEmail(email, firstName, invoiceNumber, pdfPath) {
    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: `Votre facture ${invoiceNumber} - TrioNova`,
      html: `
        <h2>Votre facture</h2>
        <p>Bonjour ${firstName},</p>
        <p>Votre facture N° ${invoiceNumber} est disponible en pièce jointe.</p>
        <p>Merci pour votre achat !</p>
        <p>Cordialement,<br>L'équipe TrioNova</p>
      `,
      attachments: [
        {
          filename: `facture_${invoiceNumber}.pdf`,
          path: pdfPath
        }
      ]
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Erreur envoi email facture:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email de facture');
    }
  }

  async sendCreditNoteEmail(email, firstName, creditNoteNumber, amount, reason, pdfPath) {
    const safeName = firstName || 'Client';
    const safeAmount = Number(amount || 0).toFixed(2);
    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: `Votre avoir ${creditNoteNumber} - TrioNova`,
      html: `
        <h2>Votre avoir est disponible</h2>
        <p>Bonjour ${safeName},</p>
        <p>Un avoir a été émis sur votre compte.</p>
        <p><strong>Référence :</strong> ${creditNoteNumber}</p>
        <p><strong>Montant :</strong> ${safeAmount} EUR</p>
        <p><strong>Motif :</strong> ${reason || 'Ajustement comptable'}</p>
        <p>Le document PDF de l'avoir est joint à cet email.</p>
        <p>Cordialement,<br>L'équipe TrioNova</p>
      `,
      attachments: [
        {
          filename: `avoir_${creditNoteNumber}.pdf`,
          path: pdfPath
        }
      ]
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Erreur envoi email avoir:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email d\'avoir');
    }
  }

  async sendOrderConfirmation(email, firstName, orderNumber, total) {
    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: `Confirmation de commande ${orderNumber} - TrioNova`,
      html: `
        <h2>Commande confirmée</h2>
        <p>Bonjour ${firstName || ''},</p>
        <p>Nous avons bien reçu votre paiement.</p>
        <p><strong>Commande :</strong> ${orderNumber}</p>
        <p><strong>Montant :</strong> ${Number(total || 0).toFixed(2)} EUR</p>
        <p>Un email de facture vous sera transmis si la facture est disponible.</p>
        <p>Cordialement,<br>L'équipe TrioNova</p>
      `
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Erreur envoi email confirmation commande:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email de confirmation de commande');
    }
  }
}

