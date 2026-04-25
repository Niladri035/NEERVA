require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/neerva';

const users = [
  {
    username: 'admin',
    password: 'password123',
    role: 'admin',
    name: 'Director Vance'
  },
  {
    username: 'fisherman',
    password: 'password123',
    role: 'fisherman',
    name: 'Captain Ahab'
  },
  {
    username: 'scientist',
    password: 'password123',
    role: 'scientist',
    name: 'Dr. Aronnax'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    await User.deleteMany({});
    console.log('Cleared existing users');

    for (const u of users) {
      await User.create(u);
    }
    
    console.log('Successfully seeded default users:');
    users.forEach(u => console.log(` - ${u.role}: ${u.username} / password123`));

    process.exit(0);
  } catch (err) {
    console.error('Error seeding users:', err);
    process.exit(1);
  }
}

seed();
