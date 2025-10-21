const express = require('express');
const router = express.Router();
const Order = require('../models/order');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
};

// Get user's orders
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.session.userId })
            .populate('products.product')
            .populate('shippingAddress')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Cancel order
router.post('/:orderId/cancel', isAuthenticated, async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order.findOne({ 
            _id: req.params.orderId,
            user: req.session.userId
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if order can be cancelled
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({ error: 'Order cannot be cancelled' });
        }

        order.status = 'cancelled';
        order.cancellationReason = reason;
        order.cancelledAt = new Date();
        await order.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel order' });
    }
});

module.exports = router;