const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Check if CONNECTION_STRING is defined
    const mongoURI = process.env.CONNECTION_STRING;
    
    if (!mongoURI) {
      console.error('CONNECTION_STRING is not defined in .env file');
      process.exit(1);
    }

    // Remove deprecated options
    await mongoose.connect(mongoURI);
    
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;