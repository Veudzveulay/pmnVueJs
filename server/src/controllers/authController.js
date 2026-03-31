const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ConsentLog = require('../models/ConsentLog');
const { registerSchema, loginSchema } = require('../validators/authValidator');

// Générer un token JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, email, password, role, gdprConsent } = req.body;

    // Vérification du consentement RGPD
    if (!gdprConsent) {
      return res.status(400).json({ message: 'Vous devez accepter la politique de confidentialité pour vous inscrire.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      consentDate: new Date(),
      consentVersion: '1.0',
    });

    // Log du consentement (RGPD)
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip || '0.0.0.0';
    await ConsentLog.create({
      user: user._id,
      action: 'consent_given',
      ipAddress: clientIp,
      details: 'Consentement donné lors de l\'inscription (version 1.0).',
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        consentDate: user.consentDate,
        consentVersion: user.consentVersion,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        consentDate: user.consentDate,
        consentVersion: user.consentVersion,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        consentDate: req.user.consentDate,
        consentVersion: req.user.consentVersion,
        isAnonymized: req.user.isAnonymized,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
