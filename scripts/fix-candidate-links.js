/**
 * One-off migration: link candidateId on all existing offers where
 * candidateId is null but a matching User record exists for candidateEmail.
 *
 * Run: node scripts/fix-candidate-links.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });

const mongoose = require('mongoose');

async function main() {
  const mongoUri =
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/blockchain_job_verification';

  await mongoose.connect(mongoUri);
  console.log('✅  Connected to MongoDB:', mongoUri);

  const db = mongoose.connection.db;
  const offers = db.collection('joboffers');
  const users = db.collection('users');

  // Find all offers without a candidateId
  const orphans = await offers
    .find({ candidateId: null })
    .project({ _id: 1, offerId: 1, candidateEmail: 1, status: 1 })
    .toArray();

  console.log(`ℹ️   Found ${orphans.length} offer(s) with no candidateId`);

  let fixed = 0;
  let skipped = 0;

  for (const offer of orphans) {
    const email = (offer.candidateEmail || '').toLowerCase().trim();
    if (!email) { skipped++; continue; }

    const candidate = await users.findOne({
      email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (!candidate) { skipped++; continue; }

    await offers.updateOne(
      { _id: offer._id },
      { $set: { candidateId: candidate._id } }
    );

    console.log(
      `   ✔  Linked  offer ${offer.offerId || offer._id}  (${email})  →  user ${candidate._id}`
    );
    fixed++;
  }

  console.log(`\n✅  Done. Fixed: ${fixed}  |  No matching user: ${skipped}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
