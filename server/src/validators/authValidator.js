const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères.',
    'string.max': 'Le nom ne peut pas dépasser 50 caractères.',
    'any.required': 'Le nom est requis.',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Veuillez fournir un email valide.',
    'any.required': "L'email est requis.",
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 6 caractères.',
    'any.required': 'Le mot de passe est requis.',
  }),
  role: Joi.string().valid('organisateur', 'participant').default('participant').messages({
    'any.only': 'Le rôle doit être "organisateur" ou "participant".',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Veuillez fournir un email valide.',
    'any.required': "L'email est requis.",
  }),
  password: Joi.string().required().messages({
    'any.required': 'Le mot de passe est requis.',
  }),
});

module.exports = { registerSchema, loginSchema };
