import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'L\'email est requis'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Le mot de passe est requis'
  }),
  firstName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Le prénom doit contenir au moins 2 caractères',
    'string.max': 'Le prénom ne peut pas dépasser 100 caractères',
    'any.required': 'Le prénom est requis'
  }),
  lastName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'string.max': 'Le nom ne peut pas dépasser 100 caractères',
    'any.required': 'Le nom est requis'
  })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'L\'email est requis'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Le mot de passe est requis'
  })
});

export const confirmEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Le token est requis'
  })
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Le refresh token est requis'
  })
});

export const logoutSchema = Joi.object({
  refreshToken: Joi.string().optional()
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'L\'email est requis'
  })
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Le token est requis'
  }),
  newPassword: Joi.string().required().messages({
    'any.required': 'Le nouveau mot de passe est requis'
  })
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Le mot de passe actuel est requis'
  }),
  newPassword: Joi.string().required().messages({
    'any.required': 'Le nouveau mot de passe est requis'
  })
});

