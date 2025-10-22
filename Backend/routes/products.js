const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/product');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images and videos only
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Middleware to check admin authentication (you should implement this)
const isAdmin = (req, res, next) => {
    // Implement admin authentication
    next();
};

// Create a new product
router.post('/', isAdmin, upload.array('images', 10), async (req, res) => {
    try {
        const { name, description, price, category, stock, featured } = req.body;
        const images = req.files ? req.files.map(file => path.join('uploads', file.filename)) : [];
        
        const product = new Product({
            name,
            description,
            price,
            category,
            images,
            stock,
            featured
        });

        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get products' });
    }
});

// Get a single product
router.get('/:productId', async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get product' });
    }
});

// Update a product
router.put('/:productId', isAdmin, upload.array('images', 10), async (req, res) => {
    try {
        const { name, description, price, category, stock, featured } = req.body;
        const images = req.files ? req.files.map(file => path.join('uploads', file.filename)) : [];

        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.category = category || product.category;
        product.stock = stock || product.stock;
        product.featured = featured || product.featured;

        if (images.length > 0) {
            // Remove old images
            product.images.forEach(image => {
                if (fs.existsSync(path.join(__dirname, '..', image))) {
                    fs.unlinkSync(path.join(__dirname, '..', image));
                }
            });
            product.images = images;
        }

        await product.save();
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete a product
router.delete('/:productId', isAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Remove images
        product.images.forEach(image => {
            if (fs.existsSync(path.join(__dirname, '..', image))) {
                fs.unlinkSync(path.join(__dirname, '..', image));
            }
        });

        await product.remove();
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});


// Add images/videos to product
router.post('/:productId/media', isAdmin, upload.array('media', 10), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const product = await Product.findById(req.params.productId);
        if (!product) {
            // Delete uploaded files if product not found
            files.forEach(file => fs.unlinkSync(file.path));
            return res.status(404).json({ error: 'Product not found' });
        }

        const mediaFiles = files.map(file => {
            const relativePath = path.relative(path.join(__dirname, '..'), file.path);
            return file.mimetype.startsWith('image/') 
                ? product.images.push(relativePath)
                : product.videos.push(relativePath);
        });

        await product.save();
        res.json(product);
    } catch (error) {
        // Delete uploaded files if error occurs
        if (req.files) {
            req.files.forEach(file => fs.unlinkSync(file.path));
        }
        res.status(500).json({ error: 'Failed to upload media' });
    }
});

// Delete image/video from product
router.delete('/:productId/media/:filename', isAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const filename = req.params.filename;
        const filePath = path.join(__dirname, '..', 'uploads', filename);

        // Remove from images array
        product.images = product.images.filter(img => !img.includes(filename));
        // Remove from videos array
        product.videos = product.videos.filter(vid => !vid.includes(filename));

        // Delete file from disk
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await product.save();
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete media' });
    }
});

// Serve uploaded files
router.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

module.exports = router;