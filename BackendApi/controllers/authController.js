import { AuthService } from '../services/authService.js';

export class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  register = async (req, res, next) => {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const result = await this.authService.register(req.body, baseUrl);
      res.status(201).json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  confirmEmail = async (req, res, next) => {
    try {
      const { token } = req.body;
      const result = await this.authService.confirmEmail(token);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';
      const guestToken = req.headers['x-guest-token'] || req.headers['guest-token'] || req.body.guestToken || null;
      const result = await this.authService.login(req.body.email, req.body.password, ipAddress, userAgent, guestToken);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.logout(refreshToken);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req, res, next) => {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const result = await this.authService.forgotPassword(req.body.email, baseUrl);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      const result = await this.authService.resetPassword(token, newPassword);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;
      const result = await this.authService.changePassword(userId, currentPassword, newPassword);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };
}

