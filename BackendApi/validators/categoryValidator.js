import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'string.max': 'Le nom ne peut pas dépasser 100 caractères',
    'any.required': 'Le nom est requis'
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'La description ne peut pas dépasser 1000 caractères'
  }),
  parentId: Joi.number().integer().positive().allow(null).optional().messages({
    'number.integer': 'L\'ID parent doit être un nombre entier',
    'number.positive': 'L\'ID parent doit être positif'
  }),
  displayOrder: Joi.number().integer().min(0).default(0).optional().messages({
    'number.integer': 'L\'ordre d\'affichage doit être un nombre entier',
    'number.min': 'L\'ordre d\'affichage ne peut pas être négatif'
  }),
  status: Joi.string().valid('active', 'inactive').default('active').optional().messages({
    'any.only': 'Le statut doit être "active" ou "inactive"'
  }),
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required().messages({
    'string.pattern.base': 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets',
    'any.required': 'Le slug est requis'
  }),
  imageUrl: Joi.string().uri().max(2048).allow('', null).optional()
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'string.max': 'Le nom ne peut pas dépasser 100 caractères'
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'La description ne peut pas dépasser 1000 caractères'
  }),
  parentId: Joi.number().integer().positive().allow(null).optional().messages({
    'number.integer': 'L\'ID parent doit être un nombre entier',
    'number.positive': 'L\'ID parent doit être positif'
  }),
  displayOrder: Joi.number().integer().min(0).optional().messages({
    'number.integer': 'L\'ordre d\'affichage doit être un nombre entier',
    'number.min': 'L\'ordre d\'affichage ne peut pas être négatif'
  }),
  status: Joi.string().valid('active', 'inactive').optional().messages({
    'any.only': 'Le statut doit être "active" ou "inactive"'
  }),
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().messages({
    'string.pattern.base': 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'
  }),
  imageUrl: Joi.string().uri().max(2048).allow('', null).optional()
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

