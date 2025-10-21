const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const Product = require('../models/product');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
};

// Get user's cart
router.get('/', isAuthenticated, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.session.userId })
            .populate('items.product');
        
        if (!cart) {
            cart = new Cart({ userId: req.session.userId, items: [] });
            await cart.save();
        }
        
        res.json(cart);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Error fetching cart' });
    }
});

// Add item to cart
router.post('/items', isAuthenticated, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            cart = new Cart({ userId: req.session.userId, items: [] });
        }

        const existingItem = cart.items.find(item => 
            item.product.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ product: productId, quantity });
        }

        await cart.save();
        await cart.populate('items.product');
        
        res.json(cart);
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'Error adding item to cart' });
    }
});

// Update item quantity in cart
router.put('/items/:productId', isAuthenticated, async (req, res) => {
    try {
        const { quantity } = req.body;
        
        if (quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        const cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const item = cart.items.find(item => 
            item.product.toString() === req.params.productId
        );

        if (!item) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        item.quantity = quantity;
        await cart.save();
        await cart.populate('items.product');
        
        res.json(cart);
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ error: 'Error updating cart item' });
    }
});

// Remove item from cart
router.delete('/items/:productId', isAuthenticated, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => 
            item.product.toString() !== req.params.productId
        );

        await cart.save();
        await cart.populate('items.product');
        
        res.json(cart);
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ error: 'Error removing item from cart' });
    }
});

// Clear cart
router.delete('/', isAuthenticated, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = [];
        await cart.save();
        
        res.json(cart);
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'Error clearing cart' });
    }
});

module.exports = router;