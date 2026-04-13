export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // erreur de validation Joi
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: err.message
      }
    });
  }

  // erreur JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AuthenticationError',
        message: 'Token invalide ou expiré'
      }
    });
  }

  // erreur personnalisée avec message
  if (err.message) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: {
        type: err.name || 'ServerError',
        message: err.message
      }
    });
  }

  // erreur par défaut
  res.status(500).json({
    success: false,
    error: {
      type: 'ServerError',
      message: 'Une erreur interne est survenue'
    }
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      type: 'NotFoundError',
      message: `Route ${req.method} ${req.path} introuvable`
    }
  });
};

