const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données
connectDB();

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/users', require('./routes/users'));

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EventFlow API is running' });
});

// Gestion des routes inexistantes
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable.' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur EventFlow démarré sur le port ${PORT}`);
});
