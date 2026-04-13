import { UserRepository } from '../repositories/userRepository.js';

const userRepository = new UserRepository();

export const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          type: 'AuthenticationError',
          message: 'Utilisateur introuvable'
        }
      });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          type: 'AuthorizationError',
          message: 'Accès refusé. Droits administrateur requis.'
        }
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          type: 'AuthorizationError',
          message: 'Compte désactivé'
        }
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

