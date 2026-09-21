require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const publishAll = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI missing');
    }
    await mongoose.connect(process.env.MONGO_URI);
    const result = await Course.updateMany({}, { $set: { isPublished: true } });
    console.log(`Updated ${result.modifiedCount || 0} courses to isPublished: true`);
    const total = await Course.countDocuments();
    console.log(`Total courses in MongoDB: ${total}`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

publishAll();
