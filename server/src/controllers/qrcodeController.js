const crypto = require('crypto');
const QRCode = require('qrcode');
const Event = require('../models/Event');

// Générer un token QR unique pour une inscription
function generateQRToken(userId, eventId) {
  const data = `${userId}-${eventId}-${process.env.JWT_SECRET}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

// GET /api/events/:id/qrcode — Générer le QR code de participation
exports.getQRCode = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement introuvable.' });
    }

    // Vérifier que l'utilisateur est inscrit
    const isRegistered = event.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isRegistered) {
      return res.status(403).json({ message: "Vous n'êtes pas inscrit à cet événement." });
    }

    const qrToken = generateQRToken(req.user._id, event._id);

    // Données encodées dans le QR code
    const qrData = JSON.stringify({
      token: qrToken,
      eventId: event._id,
      userId: req.user._id,
      eventTitle: event.title,
      userName: req.user.name,
    });

    // Générer le QR code en base64 (PNG)
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });

    res.json({
      qrCode: qrCodeDataUrl,
      token: qrToken,
      eventTitle: event.title,
      userName: req.user.name,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/events/:id/validate-qr — Valider un QR code (organisateur)
exports.validateQRCode = async (req, res) => {
  try {
    const { token, userId } = req.body;

    if (!token || !userId) {
      return res.status(400).json({ message: 'Token et userId requis.' });
    }

    const event = await Event.findById(req.params.id)
      .populate('participants', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Événement introuvable.' });
    }

    // Vérifier que le demandeur est l'organisateur ou admin
    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Seul l\'organisateur peut scanner les QR codes.' });
    }

    // Vérifier que l'utilisateur est bien inscrit
    const participant = event.participants.find(
      (p) => p._id.toString() === userId.toString()
    );

    if (!participant) {
      return res.status(400).json({
        valid: false,
        message: 'Ce participant n\'est pas inscrit à cet événement.',
      });
    }

    // Vérifier le token
    const expectedToken = generateQRToken(userId, event._id);
    if (token !== expectedToken) {
      return res.status(400).json({
        valid: false,
        message: 'QR code invalide.',
      });
    }

    res.json({
      valid: true,
      message: 'QR code valide !',
      participant: {
        name: participant.name,
        email: participant.email,
      },
      eventTitle: event.title,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
