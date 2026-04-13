import Joi from 'joi';

export const addItemSchema = Joi.object({
  productId: Joi.number().integer().positive().required().messages({
    'number.base': 'L\'ID du produit doit être un nombre',
    'number.integer': 'L\'ID du produit doit être un entier',
    'number.positive': 'L\'ID du produit doit être positif',
    'any.required': 'L\'ID du produit est requis'
  }),
  quantity: Joi.number().integer().positive().default(1).messages({
    'number.base': 'La quantité doit être un nombre',
    'number.integer': 'La quantité doit être un entier',
    'number.positive': 'La quantité doit être positive'
  })
});

export const updateItemSchema = Joi.object({
  productId: Joi.number().integer().positive().required().messages({
    'number.base': 'L\'ID du produit doit être un nombre',
    'number.integer': 'L\'ID du produit doit être un entier',
    'number.positive': 'L\'ID du produit doit être positif',
    'any.required': 'L\'ID du produit est requis'
  }),
  quantity: Joi.number().integer().positive().min(1).required().messages({
    'number.base': 'La quantité doit être un nombre',
    'number.integer': 'La quantité doit être un entier',
    'number.positive': 'La quantité doit être positive',
    'number.min': 'La quantité doit être au moins 1',
    'any.required': 'La quantité est requise'
  })
});

export const removeItemSchema = Joi.object({
  productId: Joi.number().integer().positive().required().messages({
    'number.base': 'L\'ID du produit doit être un nombre',
    'number.integer': 'L\'ID du produit doit être un entier',
    'number.positive': 'L\'ID du produit doit être positif',
    'any.required': 'L\'ID du produit est requis'
  })
});
