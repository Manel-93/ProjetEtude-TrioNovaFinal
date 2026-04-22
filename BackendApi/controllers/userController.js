import fs from 'fs';
import { UserService } from '../services/userService.js';

export class UserController {
  constructor() {
    this.userService = new UserService();
  }

  getMyProfile = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const profile = await this.userService.getMyProfile(userId);
      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  };

  getMyCreditNotes = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;
      const result = await this.userService.getMyCreditNotes(userId, { page, limit });
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  getMyCreditNotePDF = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const creditNoteId = parseInt(req.params.id, 10);
      const pdfPath = await this.userService.getMyCreditNotePDF(userId, creditNoteId);
      if (!pdfPath) {
        return res.status(404).json({
          success: false,
          error: { message: 'PDF d\'avoir introuvable' }
        });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="avoir_${creditNoteId}.pdf"`);
      fs.createReadStream(pdfPath).pipe(res);
    } catch (error) {
      next(error);
    }
  };

  updateMyProfile = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const updatedUser = await this.userService.updateMyProfile(userId, req.body);
      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Profil mis à jour avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  deleteMyAccount = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const result = await this.userService.deleteMyAccount(userId);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  getMyLoginHistory = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;
      const result = await this.userService.getLoginHistory(userId, { page, limit });
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  // Address management
  getMyAddresses = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { type } = req.query;
      const addresses = await this.userService.getMyAddresses(userId, type);
      res.status(200).json({
        success: true,
        data: addresses
      });
    } catch (error) {
      next(error);
    }
  };

  createAddress = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const address = await this.userService.createAddress(userId, req.body);
      res.status(201).json({
        success: true,
        data: address,
        message: 'Adresse créée avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  updateAddress = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const address = await this.userService.updateAddress(userId, id, req.body);
      res.status(200).json({
        success: true,
        data: address,
        message: 'Adresse mise à jour avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  setDefaultAddress = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const address = await this.userService.setDefaultAddress(userId, id);
      res.status(200).json({
        success: true,
        data: address,
        message: 'Adresse par défaut mise à jour'
      });
    } catch (error) {
      next(error);
    }
  };

  deleteAddress = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const result = await this.userService.deleteAddress(userId, id);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  // Payment method management
  getMyPaymentMethods = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const methods = await this.userService.getMyPaymentMethods(userId);
      res.status(200).json({
        success: true,
        data: methods
      });
    } catch (error) {
      next(error);
    }
  };

  createPaymentMethod = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const method = await this.userService.createPaymentMethod(userId, req.body);
      res.status(201).json({
        success: true,
        data: method,
        message: 'Méthode de paiement ajoutée avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  setDefaultPaymentMethod = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const method = await this.userService.setDefaultPaymentMethod(userId, id);
      res.status(200).json({
        success: true,
        data: method,
        message: 'Méthode de paiement par défaut mise à jour'
      });
    } catch (error) {
      next(error);
    }
  };

  deletePaymentMethod = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const result = await this.userService.deletePaymentMethod(userId, id);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };
}

