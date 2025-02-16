const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const {
    getAllBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
    getAllBlogsAdmin,
    getBlogByIdAdmin
} = require('../controllers/blogController');

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/blogs';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Multer upload configuration
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
        }
    }
});

// Debugging Middleware
const routeLogger = (req, res, next) => {
    console.log('Blog Route Access:', {
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        query: req.query,
        body: req.body,
        headers: {
            contentType: req.headers['content-type'],
            authorization: req.headers.authorization ? 'Present' : 'Not Present'
        }
    });
    next();
};

// Apply route logger to all routes
router.use(routeLogger);

// Public Blog Routes
// Get all published blogs
router.get('/', getAllBlogs);

// Get single published blog by ID
router.get('/:id', getBlogById);

// Admin Blog Routes (Protected)
// Get all blogs (including drafts)
router.get('/blog/admin', protect, getAllBlogsAdmin);

// Get single blog by ID for admin (all statuses)
router.get('/blog/admin/:id', protect, getBlogByIdAdmin);

// Create new blog
router.post('/blog/admin', protect, upload.single('image'), createBlog);

// Update existing blog
router.put('/blog/admin/:id', protect, upload.single('image'), updateBlog);

// Delete blog
router.delete('/blog/admin/:id', protect, deleteBlog);

// Error Handling Middleware
router.use((err, req, res, next) => {
    console.error('Blog Route Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Unexpected error in blog routes',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = router;
