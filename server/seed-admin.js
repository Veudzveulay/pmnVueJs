const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function seedAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await mongoose.connection.db
    .collection('users')
    .updateOne({ email: 'admin@test.com' }, { $set: { role: 'admin' } });

  if (result.matchedCount === 0) {
    console.log('Utilisateur admin@test.com introuvable. Crée le compte d\'abord via le formulaire d\'inscription.');
  } else {
    console.log('admin@test.com est maintenant Admin !');
  }

  await mongoose.disconnect();
}

seedAdmin();
