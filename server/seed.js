require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const users = db.collection('users');

  // Remove existing demo accounts
  await users.deleteMany({
    email: { $in: ['admin@blockverify.io', 'hr@techcorp.io', 'john@candidate.io'] }
  });

  const hash = async (pw) => bcrypt.hash(pw, 12);

  await users.insertMany([
    {
      name: 'System Admin',
      email: 'admin@blockverify.io',
      password: await hash('Admin@1234'),
      role: 'admin',
      isVerified: true,
      isActive: true,
      createdAt: new Date()
    },
    {
      name: 'TechCorp HR',
      email: 'hr@techcorp.io',
      password: await hash('Employer@1234'),
      role: 'employer',
      isVerified: true,
      isActive: true,
      createdAt: new Date()
    },
    {
      name: 'John Doe',
      email: 'john@candidate.io',
      password: await hash('Candidate@1234'),
      role: 'candidate',
      isVerified: true,
      isActive: true,
      createdAt: new Date()
    }
  ]);

  console.log('✅ All 3 demo users seeded successfully!');
  console.log('   admin@blockverify.io  / Admin@1234');
  console.log('   hr@techcorp.io        / Employer@1234');
  console.log('   john@candidate.io     / Candidate@1234');
  process.exit(0);
}).catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
