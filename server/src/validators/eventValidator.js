const Joi = require('joi');

const eventSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Le titre doit contenir au moins 3 caractères.',
    'string.max': 'Le titre ne peut pas dépasser 100 caractères.',
    'any.required': 'Le titre est requis.',
  }),
  description: Joi.string().min(10).max(2000).required().messages({
    'string.min': 'La description doit contenir au moins 10 caractères.',
    'any.required': 'La description est requise.',
  }),
  date: Joi.date().iso().greater('now').required().messages({
    'date.greater': "La date doit être dans le futur.",
    'any.required': 'La date est requise.',
  }),
  location: Joi.string().min(2).max(200).required().messages({
    'string.min': 'Le lieu doit contenir au moins 2 caractères.',
    'any.required': 'Le lieu est requis.',
  }),
  maxParticipants: Joi.number().integer().min(1).required().messages({
    'number.min': 'Il faut au moins 1 place.',
    'any.required': 'Le nombre de places est requis.',
  }),
});

const eventUpdateSchema = Joi.object({
  title: Joi.string().min(3).max(100),
  description: Joi.string().min(10).max(2000),
  date: Joi.date().iso().greater('now'),
  location: Joi.string().min(2).max(200),
  maxParticipants: Joi.number().integer().min(1),
}).min(1);

module.exports = { eventSchema, eventUpdateSchema };
