import Joi from 'joi';

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'completed', 'canceled').required().messages({
    'any.only': 'Le statut doit être "pending", "processing", "completed" ou "canceled"',
    'any.required': 'Le statut est requis'
  }),
  notes: Joi.string().max(500).optional().allow(null, '').messages({
    'string.max': 'Les notes ne peuvent pas dépasser 500 caractères'
  })
});

