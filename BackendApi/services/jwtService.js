import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';

export class JwtService {
  generateAccessToken(payload) {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.accessExpiresIn
    });
  }

  generateRefreshToken(payload) {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.refreshExpiresIn
    });
  }

  generateEmailConfirmToken(payload) {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.emailConfirmExpiresIn
    });
  }

  generatePasswordResetToken(payload) {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.passwordResetExpiresIn
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
      throw new Error('Token invalide ou expiré');
    }
  }

  decodeToken(token) {
    return jwt.decode(token);
  }
}

