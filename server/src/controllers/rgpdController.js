const User = require('../models/User');
const ConsentLog = require('../models/ConsentLog');
const Event = require('../models/Event');

// Utilitaire pour récupérer l'IP du client
const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip || '0.0.0.0';
};

// GET /api/rgpd/my-data — Droit d'accès : consulter ses données personnelles
exports.getMyData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    // Log d'accès aux données (RGPD)
    await ConsentLog.create({
      user: user._id,
      action: 'data_accessed',
      ipAddress: getClientIp(req),
      details: 'Consultation des données personnelles via la page "Mes données".',
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        consentDate: user.consentDate,
        consentVersion: user.consentVersion,
        isAnonymized: user.isAnonymized,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// PUT /api/rgpd/my-data — Droit de rectification : modifier ses données personnelles
exports.updateMyData = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    if (user.isAnonymized) {
      return res.status(403).json({ message: 'Ce compte a été anonymisé. Modification impossible.' });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    // Log de modification (RGPD)
    await ConsentLog.create({
      user: user._id,
      action: 'data_modified',
      ipAddress: getClientIp(req),
      details: `Rectification des données personnelles. Champs modifiés : ${[name && 'nom', email && 'email', phone !== undefined && 'téléphone'].filter(Boolean).join(', ')}.`,
    });

    res.json({
      message: 'Données mises à jour avec succès.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        consentDate: user.consentDate,
        consentVersion: user.consentVersion,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// DELETE /api/rgpd/my-data — Droit à l'effacement : anonymisation du compte
exports.anonymizeMyData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    if (user.isAnonymized) {
      return res.status(400).json({ message: 'Ce compte est déjà anonymisé.' });
    }

    // Anonymisation des données personnelles
    user.name = `Utilisateur_Anonyme_${user._id.toString().slice(-6)}`;
    user.email = `anonyme_${user._id.toString().slice(-6)}@anonymized.local`;
    user.phone = null;
    user.isAnonymized = true;
    user.consentDate = null;
    user.consentVersion = null;

    await user.save();

    // Log d'anonymisation (RGPD) — le log est conservé même après anonymisation
    await ConsentLog.create({
      user: user._id,
      action: 'data_deleted',
      ipAddress: getClientIp(req),
      details: 'Anonymisation du compte à la demande de l\'utilisateur (droit à l\'effacement).',
    });

    res.json({ message: 'Votre compte a été anonymisé avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/rgpd/export — Droit à la portabilité : exporter ses données
exports.exportMyData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    // Récupérer les événements où l'utilisateur est inscrit
    const registeredEvents = await Event.find({ participants: user._id })
      .select('title description date location')
      .lean();

    // Récupérer les événements organisés
    const organizedEvents = await Event.find({ organizer: user._id })
      .select('title description date location maxParticipants')
      .lean();

    // Récupérer les logs de consentement
    const consentLogs = await ConsentLog.find({ user: user._id })
      .select('action timestamp details')
      .sort({ timestamp: -1 })
      .lean();

    // Log d'accès (RGPD)
    await ConsentLog.create({
      user: user._id,
      action: 'data_accessed',
      ipAddress: getClientIp(req),
      details: 'Export des données personnelles (droit à la portabilité).',
    });

    const exportData = {
      informationsPersonnelles: {
        nom: user.name,
        email: user.email,
        telephone: user.phone,
        role: user.role,
        dateInscription: user.createdAt,
        consentement: {
          date: user.consentDate,
          version: user.consentVersion,
        },
      },
      evenementsInscrits: registeredEvents,
      evenementsOrganises: organizedEvents,
      historiqueConsentement: consentLogs,
      dateExport: new Date(),
    };

    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/rgpd/consent — Enregistrer/retirer le consentement
exports.updateConsent = async (req, res) => {
  try {
    const { consent, version } = req.body;

    if (typeof consent !== 'boolean') {
      return res.status(400).json({ message: 'Le champ "consent" (boolean) est requis.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    if (consent) {
      user.consentDate = new Date();
      user.consentVersion = version || '1.0';
    } else {
      user.consentDate = null;
      user.consentVersion = null;
    }

    await user.save();

    await ConsentLog.create({
      user: user._id,
      action: consent ? 'consent_given' : 'consent_withdrawn',
      ipAddress: getClientIp(req),
      details: consent
        ? `Consentement donné (version ${version || '1.0'}).`
        : 'Consentement retiré par l\'utilisateur.',
    });

    res.json({
      message: consent ? 'Consentement enregistré.' : 'Consentement retiré.',
      consentDate: user.consentDate,
      consentVersion: user.consentVersion,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/rgpd/consent-logs — Consulter ses logs de consentement
exports.getConsentLogs = async (req, res) => {
  try {
    const logs = await ConsentLog.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .select('-__v')
      .lean();

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
