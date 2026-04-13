import Joi from 'joi';

const slideSchema = Joi.object({
  productId: Joi.number().integer().positive().allow(null).optional(),
  imageUrl: Joi.string().allow('', null).max(2048).optional(),
  linkUrl: Joi.string().allow('', null).max(2048).optional(),
  title: Joi.string().allow('', null).max(500).optional(),
  subtitle: Joi.string().allow('', null).max(1000).optional(),
  active: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().min(0).optional()
});

export const replaceHomeCarouselSchema = Joi.object({
  slides: Joi.array().items(slideSchema).max(50).required().messages({
    'any.required': 'Le tableau slides est requis',
    'array.max': 'Maximum 50 diapositives'
  })
});
