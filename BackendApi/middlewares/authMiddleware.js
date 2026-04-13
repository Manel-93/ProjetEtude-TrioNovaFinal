import { JwtService } from '../services/jwtService.js';
import { UserRepository } from '../repositories/userRepository.js';

const jwtService = new JwtService();
const userRepository = new UserRepository();

async function resolveAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, reason: 'missing' };
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwtService.verifyToken(token);

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      return { ok: false, reason: 'not_found' };
    }

    if (!user.is_email_confirmed) {
      return { ok: false, reason: 'email_not_confirmed' };
    }

    return { ok: true, decoded };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

export const authenticate = async (req, res, next) => {
  try {
    const result = await resolveAuthUser(req);
    if (!result.ok) {
      if (result.reason === 'email_not_confirmed') {
        return res.status(403).json({
          success: false,
          error: {
            type: 'AuthorizationError',
            message: 'Veuillez confirmer votre email avant d\'accéder à cette ressource'
          }
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          type: 'AuthenticationError',
          message:
            result.reason === 'missing'
              ? 'Token d\'authentification manquant'
              : result.reason === 'not_found'
                ? 'Utilisateur introuvable'
                : 'Token invalide ou expiré'
        }
      });
    }

    req.user = result.decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authentification "soft":
 * - sans token => continue en mode invité
 * - token valide => req.user alimenté
 * - token invalide => 401
 */
export const authenticateOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const result = await resolveAuthUser(req);
    if (!result.ok) {
      if (result.reason === 'email_not_confirmed') {
        return res.status(403).json({
          success: false,
          error: {
            type: 'AuthorizationError',
            message: 'Veuillez confirmer votre email avant d\'accéder à cette ressource'
          }
        });
      }
      return res.status(401).json({
        success: false,
        error: {
          type: 'AuthenticationError',
          message: 'Token invalide ou expiré'
        }
      });
    }

    req.user = result.decoded;
    return next();
  } catch (error) {
    return next(error);
  }
};

