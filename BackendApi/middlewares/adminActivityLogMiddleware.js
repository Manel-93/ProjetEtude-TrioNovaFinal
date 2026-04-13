import { AdminActivityLogService } from '../services/adminActivityLogService.js';

const logService = new AdminActivityLogService();

export const logAdminActivity = (action, entityType = null) => {
  return async (req, res, next) => {
    // Log après la réponse
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Si succès (2xx), logger l'activité
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = req.params.id || req.params.userId || req.params.productId || req.params.categoryId || req.params.orderId || null;
        
        logService.log(
          req.user.userId,
          action,
          entityType,
          entityId ? parseInt(entityId) : null,
          {
            method: req.method,
            path: req.path,
            body: req.body ? Object.keys(req.body) : null
          },
          req
        ).catch(err => {
          console.warn('⚠️ Could not log admin activity:', err.message);
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

