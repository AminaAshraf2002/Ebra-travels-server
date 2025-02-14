// config/jwt.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate JWT Token
const generateToken = (adminId) => {
  return jwt.sign({ id: adminId }, process.env.JWT_PASSWORD, {
    expiresIn: '1d' // Token expires in 1 day
  });
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_PASSWORD);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};