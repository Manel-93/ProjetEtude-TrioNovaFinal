import Joi from 'joi';

export const createContactMessageSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'string.max': 'Le nom ne peut pas dépasser 100 caractères',
    'any.required': 'Le nom est requis'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'L\'email est requis'
  }),
  subject: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Le sujet doit contenir au moins 3 caractères',
    'string.max': 'Le sujet ne peut pas dépasser 200 caractères',
    'any.required': 'Le sujet est requis'
  }),
  message: Joi.string().min(10).max(5000).required().messages({
    'string.min': 'Le message doit contenir au moins 10 caractères',
    'string.max': 'Le message ne peut pas dépasser 5000 caractères',
    'any.required': 'Le message est requis'
  }),
  source: Joi.string().max(50).optional(),
  sessionId: Joi.string().max(200).optional(),
  category: Joi.string().max(100).optional(),
  context: Joi.object().optional()
});

export const updateContactMessageStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'in_progress', 'resolved', 'archived').required().messages({
    'any.only': 'Le statut doit être "pending", "in_progress", "resolved" ou "archived"',
    'any.required': 'Le statut est requis'
  }),
  assignedTo: Joi.number().integer().positive().allow(null).optional().messages({
    'number.integer': 'L\'ID assigné doit être un nombre entier',
    'number.positive': 'L\'ID assigné doit être positif'
  })
});

