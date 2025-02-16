const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import route files
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');

// Database connection
const connectDB = require('./config/database');

// Initialize Express
const app = express();

// Allow these origins
const allowedOrigins = [
    'https://ebra-travels.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

// Enhanced helmet configuration
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
            connectSrc: ["'self'", "http:", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", "data:", "https:"],
            mediaSrc: ["'self'", "data:", "https:"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS not allowed'), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
}));

// Logging middleware
app.use(morgan('dev'));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, path) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
}));

// Debug logging for routes
app.use('/api/auth', (req, res, next) => {
    console.log('Auth route accessed:', {
        method: req.method,
        path: req.path,
        token: req.headers.authorization
    });
    next();
}, authRoutes);

app.use('/api/blogs', (req, res, next) => {
    console.log('Blog route accessed:', {
        method: req.method,
        path: req.path,
        token: req.headers.authorization
    });
    next();
}, blogRoutes);

app.use('/api/enquiries', (req, res, next) => {
    console.log('Enquiry route accessed:', {
        method: req.method,
        path: req.path,
        token: req.headers.authorization
    });
    next();
}, enquiryRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Ebra Holidays Backend',
        status: 'Running',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API 404 handler
app.use('/api/*', (req, res) => {
    console.log(`404 for API route: ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        message: 'API route not found',
        requestedPath: req.path
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : {
            stack: err.stack,
            details: err.details || {}
        }
    });
});

// Connect to Database
connectDB();

// MongoDB connection logging
mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
});

// Error handling for unhandled rejections
process.on('unhandledRejection', (err, promise) => {
    console.log('Unhandled Rejection:', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception:', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });
    server.close(() => process.exit(1));
});

module.exports = app;
