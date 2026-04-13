import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(200).required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'string.max': 'Le nom ne peut pas dépasser 200 caractères',
    'any.required': 'Le nom est requis'
  }),
  description: Joi.string().min(10).max(5000).required().messages({
    'string.min': 'La description doit contenir au moins 10 caractères',
    'string.max': 'La description ne peut pas dépasser 5000 caractères',
    'any.required': 'La description est requise'
  }),
  technicalSpecs: Joi.object().optional(),
  priceHt: Joi.number().positive().required().messages({
    'number.positive': 'Le prix HT doit être positif',
    'any.required': 'Le prix HT est requis'
  }),
  tva: Joi.number().min(0).max(100).default(20).optional().messages({
    'number.min': 'La TVA doit être entre 0 et 100',
    'number.max': 'La TVA doit être entre 0 et 100'
  }),
  stock: Joi.number().integer().min(0).default(0).optional().messages({
    'number.integer': 'Le stock doit être un nombre entier',
    'number.min': 'Le stock ne peut pas être négatif'
  }),
  priority: Joi.number().integer().default(0).optional().messages({
    'number.integer': 'La priorité doit être un nombre entier'
  }),
  status: Joi.string().valid('active', 'inactive', 'draft').default('active').optional().messages({
    'any.only': 'Le statut doit être "active", "inactive" ou "draft"'
  }),
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required().messages({
    'string.pattern.base': 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets',
    'any.required': 'Le slug est requis'
  }),
  categoryId: Joi.number().integer().positive().optional().messages({
    'number.integer': 'L\'ID de catégorie doit être un nombre entier',
    'number.positive': 'L\'ID de catégorie doit être positif'
  }),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required().messages({
        'string.uri': 'L\'URL de l\'image doit être valide',
        'any.required': 'L\'URL de l\'image est requise'
      }),
      alt: Joi.string().max(200).optional(),
      order: Joi.number().integer().min(0).optional()
    })
  ).optional()
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'string.max': 'Le nom ne peut pas dépasser 200 caractères'
  }),
  description: Joi.string().min(10).max(5000).optional().messages({
    'string.min': 'La description doit contenir au moins 10 caractères',
    'string.max': 'La description ne peut pas dépasser 5000 caractères'
  }),
  technicalSpecs: Joi.object().optional(),
  priceHt: Joi.number().positive().optional().messages({
    'number.positive': 'Le prix HT doit être positif'
  }),
  tva: Joi.number().min(0).max(100).optional().messages({
    'number.min': 'La TVA doit être entre 0 et 100',
    'number.max': 'La TVA doit être entre 0 et 100'
  }),
  stock: Joi.number().integer().min(0).optional().messages({
    'number.integer': 'Le stock doit être un nombre entier',
    'number.min': 'Le stock ne peut pas être négatif'
  }),
  priority: Joi.number().integer().optional().messages({
    'number.integer': 'La priorité doit être un nombre entier'
  }),
  status: Joi.string().valid('active', 'inactive', 'draft').optional().messages({
    'any.only': 'Le statut doit être "active", "inactive" ou "draft"'
  }),
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().messages({
    'string.pattern.base': 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'
  }),
  categoryId: Joi.number().integer().positive().allow(null).optional().messages({
    'number.integer': 'L\'ID de catégorie doit être un nombre entier',
    'number.positive': 'L\'ID de catégorie doit être positif'
  })
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

export const productImageSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.uri': 'L\'URL de l\'image doit être valide',
    'any.required': 'L\'URL de l\'image est requise'
  }),
  alt: Joi.string().max(200).optional(),
  order: Joi.number().integer().min(0).optional()
});

export const updateProductImageSchema = Joi.object({
  url: Joi.string().uri().optional().messages({
    'string.uri': 'L\'URL de l\'image doit être valide'
  }),
  alt: Joi.string().max(200).optional(),
  order: Joi.number().integer().min(0).optional(),
  isPrimary: Joi.boolean().optional()
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

