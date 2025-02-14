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
router.post('/', createEnquiry);

// Protected admin routes
router.get('/admin/enquiries', protect, getAllEnquiries);
router.put('/admin/enquiries/:id/status', protect, updateEnquiryStatus);
router.delete('/admin/enquiries/:id', protect, deleteEnquiry);
router.get('/admin/enquiries/stats', protect, getEnquiryStats);

module.exports = router;
