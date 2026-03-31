/**
 * Commande d'anonymisation des comptes inactifs
 *
 * Usage : node src/commands/anonymizeOldUsers.js [--days=730]
 *
 * Anonymise tous les utilisateurs non-admin dont le compte
 * est inactif depuis plus de N jours (défaut : 730 jours = 2 ans).
 * Conforme au principe de limitation de conservation (RGPD Art. 5.1.e).
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const ConsentLog = require('../models/ConsentLog');

async function anonymizeOldUsers() {
  // Récupérer le paramètre --days
  const daysArg = process.argv.find((arg) => arg.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 730;

  console.log(`\n🔒 Anonymisation des comptes inactifs depuis plus de ${days} jours...\n`);

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Trouver les utilisateurs non anonymisés, non-admin, inactifs
    const usersToAnonymize = await User.find({
      isAnonymized: false,
      role: { $ne: 'admin' },
      updatedAt: { $lt: cutoffDate },
    });

    console.log(`📋 ${usersToAnonymize.length} compte(s) à anonymiser.\n`);

    let count = 0;
    for (const user of usersToAnonymize) {
      const originalEmail = user.email;

      user.name = `Utilisateur_Anonyme_${user._id.toString().slice(-6)}`;
      user.email = `anonyme_${user._id.toString().slice(-6)}@anonymized.local`;
      user.phone = null;
      user.isAnonymized = true;
      user.consentDate = null;
      user.consentVersion = null;

      await user.save();

      // Log d'anonymisation
      await ConsentLog.create({
        user: user._id,
        action: 'data_deleted',
        ipAddress: '127.0.0.1',
        details: `Anonymisation automatique — compte inactif depuis plus de ${days} jours. Email original : ${originalEmail}.`,
      });

      count++;
      console.log(`  ✔ ${originalEmail} → anonymisé`);
    }

    console.log(`\n✅ ${count} compte(s) anonymisé(s) avec succès.`);
  } catch (error) {
    console.error('❌ Erreur :', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB.\n');
  }
}

anonymizeOldUsers();
