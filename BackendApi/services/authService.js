import { UserRepository } from '../repositories/userRepository.js';
import { TokenRepository } from '../repositories/tokenRepository.js';
import { LoginHistoryRepository } from '../repositories/loginHistoryRepository.js';
import { PasswordService } from './passwordService.js';
import { JwtService } from './jwtService.js';
import { EmailService } from './emailService.js';

export class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.tokenRepository = new TokenRepository();
    this.loginHistoryRepository = new LoginHistoryRepository();
    this.passwordService = new PasswordService();
    this.jwtService = new JwtService();
    this.emailService = new EmailService();
  }

  async register(userData, baseUrl) {
    // Vérifier si l'email existe déjà
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Cet email est déjà utilisé');
    }

    // Valider le mot de passe
    const passwordValidation = this.passwordService.validatePasswordStrength(userData.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // Hasher le mot de passe
    const passwordHash = await this.passwordService.hashPassword(userData.password);

    // Créer l'utilisateur
    const user = await this.userRepository.create({
      email: userData.email,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isEmailConfirmed: false
    });

    // Générer token de confirmation email
    const emailToken = this.jwtService.generateEmailConfirmToken({ userId: user.id, email: user.email });
    
    // Sauvegarder le token en MongoDB
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24h
    await this.tokenRepository.create({
      token: emailToken,
      userId: user.id,
      type: 'email_confirm',
      expiresAt
    });

    // Envoyer l'email de confirmation
    await this.emailService.sendEmailConfirmation(user.email, emailToken, baseUrl);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      message: 'Inscription réussie. Un email de confirmation a été envoyé.'
    };
  }

  async confirmEmail(token) {
    // Vérifier le token
    const decoded = this.jwtService.verifyToken(token);
    
    // Vérifier que le token existe en DB
    const tokenRecord = await this.tokenRepository.findByTokenAndType(token, 'email_confirm');
    if (!tokenRecord) {
      throw new Error('Token de confirmation invalide ou expiré');
    }

    // Confirmer l'email
    await this.userRepository.updateEmailConfirmed(decoded.userId, true);

    // Supprimer le token utilisé
    await this.tokenRepository.deleteByToken(token);

    return { message: 'Email confirmé avec succès' };
  }

  async login(email, password, ipAddress = null, userAgent = null, guestToken = null) {
    // Trouver l'utilisateur
    const user = await this.userRepository.findByEmail(email);
    
    // Logger la tentative de connexion (même en cas d'échec)
    const logLogin = async (success, failureReason = null) => {
      if (user) {
        await this.loginHistoryRepository.create({
          userId: user.id,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          success,
          failureReason
        });
      }
    };

    if (!user) {
      await logLogin(false, 'Email introuvable');
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await this.passwordService.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      await logLogin(false, 'Mot de passe incorrect');
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier que l'email est confirmé
    if (!user.is_email_confirmed) {
      await logLogin(false, 'Email non confirmé');
      throw new Error('Veuillez confirmer votre email avant de vous connecter');
    }

    // Vérifier que le compte est actif
    if (!user.is_active) {
      await logLogin(false, 'Compte désactivé');
      throw new Error('Compte désactivé');
    }

    // Générer les tokens
    const accessToken = this.jwtService.generateAccessToken({
      userId: user.id,
      email: user.email
    });

    const refreshToken = this.jwtService.generateRefreshToken({
      userId: user.id,
      email: user.email
    });

    // Sauvegarder le refresh token en MongoDB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours
    await this.tokenRepository.create({
      token: refreshToken,
      userId: user.id,
      type: 'refresh',
      expiresAt
    });

    // Synchroniser le panier invité avec le panier utilisateur (en arrière-plan)
    let cartSynced = false;
    if (guestToken) {
      try {
        const { CartService } = await import('./cartService.js');
        const cartService = new CartService();
        await cartService.syncGuestCartToUser(guestToken, user.id);
        cartSynced = true;
      } catch (error) {
        // Ne pas faire échouer la connexion si la synchronisation du panier échoue
        console.warn('⚠️  Échec de la synchronisation du panier lors de la connexion:', error.message);
      }
    }

    // Logger la connexion réussie
    await logLogin(true);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      cartSynced
    };
  }

  async refreshToken(refreshToken) {
    // Vérifier le token
    const decoded = this.jwtService.verifyToken(refreshToken);

    // Vérifier que le token existe en DB
    const tokenRecord = await this.tokenRepository.findByTokenAndType(refreshToken, 'refresh');
    if (!tokenRecord) {
      throw new Error('Refresh token invalide ou expiré');
    }

    // Vérifier que l'utilisateur existe toujours
    const user = await this.userRepository.findById(decoded.userId);
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    // Générer un nouveau access token
    const accessToken = this.jwtService.generateAccessToken({
      userId: user.id,
      email: user.email
    });

    return { accessToken };
  }

  async logout(refreshToken) {
    if (refreshToken) {
      await this.tokenRepository.deleteByToken(refreshToken);
    }
    return { message: 'Déconnexion réussie' };
  }

  async forgotPassword(email, baseUrl) {
    // Trouver l'utilisateur
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Ne pas révéler si l'email existe ou non (sécurité)
      return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
    }

    // Supprimer les anciens tokens de reset
    await this.tokenRepository.deleteByUserIdAndType(user.id, 'password_reset');

    // Générer token de reset
    const resetToken = this.jwtService.generatePasswordResetToken({
      userId: user.id,
      email: user.email
    });

    // Sauvegarder le token en MongoDB
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1h
    await this.tokenRepository.create({
      token: resetToken,
      userId: user.id,
      type: 'password_reset',
      expiresAt
    });

    // Envoyer l'email
    await this.emailService.sendPasswordReset(user.email, resetToken, baseUrl);

    return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
  }

  async resetPassword(token, newPassword) {
    // Vérifier le token
    const decoded = this.jwtService.verifyToken(token);

    // Vérifier que le token existe en DB
    const tokenRecord = await this.tokenRepository.findByTokenAndType(token, 'password_reset');
    if (!tokenRecord) {
      throw new Error('Token de réinitialisation invalide ou expiré');
    }

    // Valider le nouveau mot de passe
    const passwordValidation = this.passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // Hasher et mettre à jour le mot de passe
    const passwordHash = await this.passwordService.hashPassword(newPassword);
    await this.userRepository.updatePassword(decoded.userId, passwordHash);

    // Supprimer le token utilisé
    await this.tokenRepository.deleteByToken(token);

    // Supprimer tous les refresh tokens (forcer nouvelle connexion)
    await this.tokenRepository.deleteByUserIdAndType(decoded.userId, 'refresh');

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  async changePassword(userId, currentPassword, newPassword) {
    // Trouver l'utilisateur
    const user = await this.userRepository.findByEmail(
      (await this.userRepository.findById(userId)).email
    );

    // Vérifier le mot de passe actuel
    const isPasswordValid = await this.passwordService.comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Mot de passe actuel incorrect');
    }

    // Valider le nouveau mot de passe
    const passwordValidation = this.passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // Hasher et mettre à jour le mot de passe
    const passwordHash = await this.passwordService.hashPassword(newPassword);
    await this.userRepository.updatePassword(userId, passwordHash);

    // Supprimer tous les refresh tokens (forcer nouvelle connexion)
    await this.tokenRepository.deleteByUserIdAndType(userId, 'refresh');

    return { message: 'Mot de passe modifié avec succès' };
  }
}

