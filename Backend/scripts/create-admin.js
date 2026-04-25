require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminData = {
      username: 'admin',
      password: 'password123',
      role: 'admin',
      name: 'Niladri Santra'
    };

    // Check if user already exists
    const existingUser = await User.findOne({ username: adminData.username });
    if (existingUser) {
      console.log('Admin user already exists. Updating password...');
      existingUser.password = adminData.password;
      existingUser.name = adminData.name;
      await existingUser.save();
      console.log('Admin password updated successfully.');
    } else {
      const newUser = new User(adminData);
      await newUser.save();
      console.log('Admin user created successfully.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();
