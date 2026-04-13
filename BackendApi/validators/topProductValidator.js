import Joi from 'joi';

export const addTopProductSchema = Joi.object({
  productId: Joi.number().integer().positive().required().messages({
    'any.required': 'productId est requis',
    'number.base': 'productId doit être un nombre'
  })
});

export const reorderTopProductsSchema = Joi.object({
  orderedProductIds: Joi.array().items(Joi.number().integer().positive()).min(1).required().messages({
    'any.required': 'orderedProductIds est requis',
    'array.min': 'La liste orderedProductIds doit contenir au moins un produit'
  })
});

