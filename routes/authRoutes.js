const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  setupAdmin,
  loginAdmin,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Validation middleware for login
const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').not().isEmpty().withMessage('Password is required')
];

// Route to setup initial admin (one-time use)
router.post('/admin/setup', setupAdmin);

// Admin Login Route
router.post('/admin/login', loginValidation, loginAdmin);

// Change Password Route (protected)
router.put('/admin/change-password',
  protect,
  [
    body('currentPassword').not().isEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  changePassword
);

module.exports = router;

