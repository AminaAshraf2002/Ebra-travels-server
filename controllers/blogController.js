const Blog = require('../models/Blog');
const fs = require('fs');
const path = require('path');

// Create new blog
exports.createBlog = async (req, res) => {
    console.log('createBlog called:', {
        body: req.body,
        file: req.file,
        admin: req.admin
    });

    try {
        const { title, category, description, date, status } = req.body;
        const imagePath = req.file ? `/uploads/blogs/${req.file.filename}` : '';

        const blog = new Blog({
            title,
            category,
            description,
            date: date || Date.now(),
            status,
            image: imagePath,
            createdBy: req.admin._id
        });

        const savedBlog = await blog.save();
        console.log('Blog created:', savedBlog);
        res.status(201).json(savedBlog);
    } catch (error) {
        console.error('Error creating blog:', error);
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        res.status(400).json({ message: error.message });
    }
};

// Get all published blogs (public access)
exports.getAllBlogs = async (req, res) => {
    console.log('getAllBlogs called:', req.query);
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.search || '';

        const query = { status: 'Published' };
        if (searchTerm) {
            query.$or = [
                { title: { $regex: searchTerm, $options: 'i' } },
                { category: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        const blogs = await Blog.find(query)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Blog.countDocuments(query);

        console.log('Found published blogs:', blogs.length);
        res.json({
            blogs,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Error getting blogs:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all blogs for admin (including drafts)
exports.getAllBlogsAdmin = async (req, res) => {
    console.log('getAllBlogsAdmin called:', {
        query: req.query,
        admin: req.admin,
        headers: req.headers.authorization
    });

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.search || '';

        const query = {};
        if (searchTerm) {
            query.$or = [
                { title: { $regex: searchTerm, $options: 'i' } },
                { category: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        console.log('Executing query:', query);

        const blogs = await Blog.find(query)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Blog.countDocuments(query);
        const totalPublished = await Blog.countDocuments({ ...query, status: 'Published' });
        const totalDrafts = await Blog.countDocuments({ ...query, status: 'Draft' });

        console.log('Found admin blogs:', {
            total,
            published: totalPublished,
            drafts: totalDrafts
        });

        res.json({
            blogs,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            stats: {
                total,
                published: totalPublished,
                drafts: totalDrafts
            }
        });
    } catch (error) {
        console.error('Error in getAllBlogsAdmin:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get single published blog (public access)
exports.getBlogById = async (req, res) => {
    console.log('getBlogById called:', req.params);
    try {
        const blog = await Blog.findOne({ 
            _id: req.params.id, 
            status: 'Published' 
        });
        
        if (!blog) {
            console.log('Blog not found or not published');
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.json(blog);
    } catch (error) {
        console.error('Error getting blog by id:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get single blog for admin (all statuses)
exports.getBlogByIdAdmin = async (req, res) => {
    console.log('getBlogByIdAdmin called:', {
        params: req.params,
        admin: req.admin
    });

    try {
        const blog = await Blog.findById(req.params.id);
        
        if (!blog) {
            console.log('Blog not found');
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.json(blog);
    } catch (error) {
        console.error('Error getting blog by id (admin):', error);
        res.status(500).json({ message: error.message });
    }
};

// Update blog (admin only)
exports.updateBlog = async (req, res) => {
    console.log('updateBlog called:', {
        params: req.params,
        body: req.body,
        file: req.file
    });

    try {
        const { title, category, description, date, status } = req.body;
        const updateData = { title, category, description, date, status };

        if (req.file) {
            updateData.image = `/uploads/blogs/${req.file.filename}`;
            
            // Delete old image
            const oldBlog = await Blog.findById(req.params.id);
            if (oldBlog && oldBlog.image) {
                const oldImagePath = path.join(__dirname, '..', oldBlog.image);
                fs.unlink(oldImagePath, (err) => {
                    if (err && err.code !== 'ENOENT') console.error('Error deleting old image:', err);
                });
            }
        }

        const blog = await Blog.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!blog) {
            console.log('Blog not found for update');
            return res.status(404).json({ message: 'Blog not found' });
        }

        console.log('Blog updated successfully:', blog);
        res.json(blog);
    } catch (error) {
        console.error('Error updating blog:', error);
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        res.status(400).json({ message: error.message });
    }
};

// Delete blog (admin only)
exports.deleteBlog = async (req, res) => {
    console.log('deleteBlog called:', {
        params: req.params,
        admin: req.admin
    });

    try {
        const blog = await Blog.findById(req.params.id);
        
        if (!blog) {
            console.log('Blog not found for deletion');
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Delete associated image
        if (blog.image) {
            const imagePath = path.join(__dirname, '..', blog.image);
            fs.unlink(imagePath, (err) => {
                if (err && err.code !== 'ENOENT') console.error('Error deleting image:', err);
            });
        }

        await Blog.findByIdAndDelete(req.params.id);
        console.log('Blog deleted successfully');
        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ message: error.message });
    }
};
