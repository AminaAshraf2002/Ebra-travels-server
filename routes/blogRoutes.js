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

// Multer configuration
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

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
        }
    }
});

// Public routes (anyone can access)
router.get('/blog', getAllBlogs);
router.get('/blog/:id', getBlogById);

// Admin-only routes
router.get('/admin/blogs', protect, getAllBlogsAdmin);
router.get('/admin/blogs/:id', protect, getBlogByIdAdmin);
router.post('/admin/blogs', protect, upload.single('image'), createBlog);
router.put('/admin/blogs/:id', protect, upload.single('image'), updateBlog);
router.delete('/admin/blogs/:id', protect, deleteBlog);

module.exports = router;
