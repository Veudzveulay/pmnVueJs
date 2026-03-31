const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const qrcodeController = require('../controllers/qrcodeController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Routes publiques
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEvent);

// Routes protégées — Organisateur & Admin uniquement
router.post('/', auth, roleCheck('organisateur', 'admin'), eventController.createEvent);
router.put('/:id', auth, roleCheck('organisateur', 'admin'), eventController.updateEvent);
router.delete('/:id', auth, roleCheck('organisateur', 'admin'), eventController.deleteEvent);

// Routes protégées — Tous les utilisateurs authentifiés
router.post('/:id/register', auth, eventController.registerToEvent);
router.post('/:id/unregister', auth, eventController.unregisterFromEvent);

// QR Code
router.get('/:id/qrcode', auth, qrcodeController.getQRCode);
router.post('/:id/validate-qr', auth, roleCheck('organisateur', 'admin'), qrcodeController.validateQRCode);

module.exports = router;
