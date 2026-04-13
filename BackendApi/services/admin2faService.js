import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { Admin2FARepository } from '../repositories/admin2faRepository.js';
import { getMySQLConnection } from '../config/database.js';

export class Admin2FAService {
  constructor() {
    this.admin2faRepository = new Admin2FARepository();
  }

  // Générer un secret 2FA pour un admin
  async generateSecret(userId, email) {
    const secret = speakeasy.generateSecret({
      name: `TrioNova Admin (${email})`,
      issuer: 'TrioNova'
    });

    // Sauvegarder le secret (pas encore activé)
    const existing = await this.admin2faRepository.findByUserId(userId);
    if (existing) {
      await this.admin2faRepository.update(userId, { isEnabled: false });
      // Mettre à jour le secret
      const pool = await getMySQLConnection();
      await pool.execute(
        'UPDATE admin_2fa SET secret = ? WHERE user_id = ?',
        [secret.base32, userId]
      );
    } else {
      await this.admin2faRepository.create(userId, secret.base32);
    }

    // Générer le QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    };
  }

  // Vérifier un code 2FA
  async verifyToken(userId, token) {
    const twoFA = await this.admin2faRepository.findByUserId(userId);
    if (!twoFA || !twoFA.isEnabled) {
      throw new Error('2FA non activé pour cet utilisateur');
    }

    const verified = speakeasy.totp.verify({
      secret: twoFA.secret,
      encoding: 'base32',
      token: token,
      window: 2 // Accepter les codes dans une fenêtre de ±2 périodes (60 secondes)
    });

    return verified;
  }

  // Activer le 2FA après vérification du premier code
  async enable2FA(userId, token) {
    const verified = await this.verifyToken(userId, token);
    if (!verified) {
      throw new Error('Code 2FA invalide');
    }

    // Générer des codes de secours
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    await this.admin2faRepository.update(userId, {
      isEnabled: true,
      backupCodes: backupCodes
    });

    return { backupCodes };
  }

  // Désactiver le 2FA
  async disable2FA(userId) {
    await this.admin2faRepository.update(userId, {
      isEnabled: false,
      backupCodes: null
    });
    return true;
  }

  // Vérifier avec un code de secours
  async verifyBackupCode(userId, code) {
    const twoFA = await this.admin2faRepository.findByUserId(userId);
    if (!twoFA || !twoFA.isEnabled) {
      throw new Error('2FA non activé');
    }

    if (!twoFA.backupCodes || !twoFA.backupCodes.includes(code)) {
      return false;
    }

    // Retirer le code utilisé
    const updatedCodes = twoFA.backupCodes.filter(c => c !== code);
    await this.admin2faRepository.update(userId, {
      backupCodes: updatedCodes
    });

    return true;
  }

  // Vérifier si le 2FA est activé
  async isEnabled(userId) {
    const twoFA = await this.admin2faRepository.findByUserId(userId);
    return twoFA ? twoFA.isEnabled : false;
  }
}

