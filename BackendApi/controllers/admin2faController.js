import { Admin2FAService } from '../services/admin2faService.js';
import { UserRepository } from '../repositories/userRepository.js';

export class Admin2FAController {
  constructor() {
    this.admin2faService = new Admin2FAService();
    this.userRepository = new UserRepository();
  }

  // Générer un secret 2FA
  generateSecret = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const user = await this.userRepository.findById(userId);
      
      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: { message: 'Accès réservé aux administrateurs' }
        });
      }

      const result = await this.admin2faService.generateSecret(userId, user.email);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Secret 2FA généré. Scannez le QR code avec votre application d\'authentification.'
      });
    } catch (error) {
      next(error);
    }
  };

  // Activer le 2FA
  enable2FA = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: { message: 'Code 2FA requis' }
        });
      }

      const result = await this.admin2faService.enable2FA(userId, token);
      
      res.status(200).json({
        success: true,
        data: {
          backupCodes: result.backupCodes
        },
        message: '2FA activé avec succès. Conservez vos codes de secours en lieu sûr.'
      });
    } catch (error) {
      next(error);
    }
  };

  // Désactiver le 2FA
  disable2FA = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      await this.admin2faService.disable2FA(userId);
      
      res.status(200).json({
        success: true,
        message: '2FA désactivé avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  // Vérifier le statut 2FA
  getStatus = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const isEnabled = await this.admin2faService.isEnabled(userId);
      
      res.status(200).json({
        success: true,
        data: { isEnabled }
      });
    } catch (error) {
      next(error);
    }
  };
}

