import Joi from 'joi';

/** Téléphone optionnel : chaîne vide ignorée ; sinon format souple (international). */
const optionalPhoneSchema = Joi.string()
  .trim()
  .max(32)
  .empty('')
  .optional()
  .messages({
    'string.max': 'Le numéro de téléphone est trop long',
    'any.invalid': 'Le numéro de téléphone doit contenir au moins 8 chiffres'
  })
  .custom((value, helpers) => {
    if (value == null) return value;
    const digits = value.replace(/\D/g, '');
    if (digits.length < 8) {
      return helpers.error('any.invalid');
    }
    return value;
  });

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Le prénom doit contenir au moins 2 caractères',
    'string.max': 'Le prénom ne peut pas dépasser 100 caractères'
  }),
  lastName: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'string.max': 'Le nom ne peut pas dépasser 100 caractères'
  }),
  phone: optionalPhoneSchema
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

export const addressSchema = Joi.object({
  type: Joi.string().valid('billing', 'shipping').required().messages({
    'any.only': 'Le type doit être "billing" ou "shipping"',
    'any.required': 'Le type est requis'
  }),
  firstName: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Le prénom doit contenir au moins 2 caractères',
    'any.required': 'Le prénom est requis'
  }),
  lastName: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'any.required': 'Le nom est requis'
  }),
  company: Joi.string().trim().max(100).optional(),
  addressLine1: Joi.string().trim().min(5).max(200).required().messages({
    'string.min': 'L\'adresse doit contenir au moins 5 caractères',
    'any.required': 'L\'adresse est requise'
  }),
  addressLine2: Joi.string().trim().max(200).allow('').optional(),
  city: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'La ville doit contenir au moins 2 caractères',
    'any.required': 'La ville est requise'
  }),
  postalCode: Joi.string()
    .trim()
    .uppercase()
    .required()
    .messages({
      'any.invalid':
        'Code postal invalide (ex. 75001, 97100 ou SW1A 1AA — pas de caractères spéciaux hors espace / tiret)',
      'any.required': 'Le code postal est requis'
    })
    .custom((value, helpers) => {
      const cleaned = value.replace(/\./g, '').replace(/\s+/g, ' ').trim();
      if (!/^[0-9A-Z\s-]{3,15}$/.test(cleaned)) {
        return helpers.error('any.invalid');
      }
      return cleaned;
    }),
  country: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Le pays doit contenir au moins 2 caractères',
    'any.required': 'Le pays est requis'
  }),
  phone: optionalPhoneSchema
});

export const updateAddressSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100).optional(),
  lastName: Joi.string().trim().min(2).max(100).optional(),
  company: Joi.string().trim().max(100).optional(),
  addressLine1: Joi.string().trim().min(5).max(200).optional(),
  addressLine2: Joi.string().trim().max(200).allow('').optional(),
  city: Joi.string().trim().min(2).max(100).optional(),
  postalCode: Joi.string()
    .trim()
    .uppercase()
    .optional()
    .messages({
      'any.invalid': 'Format de code postal invalide'
    })
    .custom((value, helpers) => {
      if (value === undefined || value === '') return value;
      const cleaned = value.replace(/\./g, '').replace(/\s+/g, ' ').trim();
      if (!/^[0-9A-Z\s-]{3,15}$/.test(cleaned)) {
        return helpers.error('any.invalid');
      }
      return cleaned;
    }),
  country: Joi.string().trim().min(2).max(100).optional(),
  phone: optionalPhoneSchema
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

export const paymentMethodSchema = Joi.object({
  stripeCustomerId: Joi.string().allow('', null).optional(),
  stripePaymentMethodId: Joi.string().allow('', null).optional(),
  type: Joi.string().valid('card', 'bank_account').default('card').optional(),
  last4: Joi.string().pattern(/^\d{4}$/).optional().messages({
    'string.pattern.base': 'Les 4 derniers chiffres doivent être numériques'
  }),
  brand: Joi.string().allow('', null).optional(),
  expiryMonth: Joi.number().min(1).max(12).optional(),
  expiryYear: Joi.number().min(new Date().getFullYear()).optional()
}).or('stripePaymentMethodId', 'last4').messages({
  'object.missing': 'Un moyen de paiement Stripe ou les 4 derniers chiffres sont requis'
});

export const updateUserStatusSchema = Joi.object({
  is_active: Joi.boolean().required().messages({
    'any.required': 'Le statut is_active est requis'
  })
});

