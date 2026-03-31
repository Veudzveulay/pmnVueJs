const express = require('express');
const router = express.Router();
const rgpdController = require('../controllers/rgpdController');
const auth = require('../middleware/auth');

// Toutes les routes RGPD nécessitent une authentification
router.use(auth);

// Droit d'accès — consulter ses données
router.get('/my-data', rgpdController.getMyData);

// Droit de rectification — modifier ses données
router.put('/my-data', rgpdController.updateMyData);

// Droit à l'effacement — anonymiser son compte
router.delete('/my-data', rgpdController.anonymizeMyData);

// Droit à la portabilité — exporter ses données (JSON)
router.get('/export', rgpdController.exportMyData);

// Gestion du consentement
router.post('/consent', rgpdController.updateConsent);

// Consulter ses logs de consentement
router.get('/consent-logs', rgpdController.getConsentLogs);

module.exports = router;
