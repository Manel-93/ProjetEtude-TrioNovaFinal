import Joi from 'joi';

export const enable2FASchema = Joi.object({
  token: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'Le code 2FA doit contenir 6 chiffres',
    'string.pattern.base': 'Le code 2FA doit contenir uniquement des chiffres',
    'any.required': 'Le code 2FA est requis'
  })
});

export const resetUserPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
    'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
    'any.required': 'Le nouveau mot de passe est requis'
  }),
  sendEmail: Joi.boolean().default(true).optional()
});

