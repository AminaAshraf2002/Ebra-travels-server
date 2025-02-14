const express = require('express');
const router = express.Router();
const { 
  createEnquiry, 
  getAllEnquiries, 
  updateEnquiryStatus, 
  deleteEnquiry,
  getEnquiryStats
} = require('../controllers/enquiryController');
const { protect } = require('../middleware/authMiddleware');

// Public route for creating enquiry
router.post('/blogs', createEnquiry);

// Protected admin routes
router.get('/admin/enquiries', protect, getAllEnquiries);
router.put('/:id/status', protect, updateEnquiryStatus);
router.delete('/:id', protect, deleteEnquiry);
router.get('/stats', protect, getEnquiryStats);

module.exports = router;
