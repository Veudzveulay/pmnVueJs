const Event = require('../models/Event');
const { eventSchema, eventUpdateSchema } = require('../validators/eventValidator');

// GET /api/events — Tous les événements
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email')
      .populate('participants', 'name email')
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/events/:id — Un événement
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('participants', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Événement introuvable.' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/events — Créer un événement (organisateur/admin)
exports.createEvent = async (req, res) => {
  try {
    const { error } = eventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const event = await Event.create({
      ...req.body,
      organizer: req.user._id,
    });

    await event.populate('organizer', 'name email');

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// PUT /api/events/:id — Modifier un événement
exports.updateEvent = async (req, res) => {
  try {
    const { error } = eventUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement introuvable.' });
    }

    // Vérifier que l'utilisateur est l'organisateur ou admin
    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres événements.' });
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('organizer', 'name email')
      .populate('participants', 'name email');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// DELETE /api/events/:id — Supprimer un événement
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement introuvable.' });
    }

    // Vérifier que l'utilisateur est l'organisateur ou admin
    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres événements.' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Événement supprimé avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/events/:id/register — S'inscrire à un événement
exports.registerToEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement introuvable.' });
    }

    // Vérifier si déjà inscrit
    if (event.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'Vous êtes déjà inscrit à cet événement.' });
    }

    // Vérifier les places disponibles
    if (event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ message: 'Plus de places disponibles.' });
    }

    event.participants.push(req.user._id);
    await event.save();

    await event.populate('organizer', 'name email');
    await event.populate('participants', 'name email');

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/events/:id/unregister — Se désinscrire d'un événement
exports.unregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement introuvable.' });
    }

    if (!event.participants.includes(req.user._id)) {
      return res.status(400).json({ message: "Vous n'êtes pas inscrit à cet événement." });
    }

    event.participants = event.participants.filter(
      (p) => p.toString() !== req.user._id.toString()
    );
    await event.save();

    await event.populate('organizer', 'name email');
    await event.populate('participants', 'name email');

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
