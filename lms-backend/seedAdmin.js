require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing in .env file.');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const email = 'jijeshmoshimoshi@gmail.com';
    const password = 'Jijesh@123';
    const role = 'admin';
    const name = 'Jijesh Admin';

    let user = await User.findOne({ email });

    if (user) {
      user.name = name;
      user.password = password; // pre-save hook will hash this
      user.role = role;
      await user.save();
      console.log(`Successfully updated user ${email} to role: admin`);
    } else {
      user = await User.create({
        name,
        email,
        password,
        role,
      });
      console.log(`Successfully created new admin user ${email}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin user:', err);
    process.exit(1);
  }
};

seedAdmin();
