const express = require('express');
const router = express.Router();
const Address = require('../models/address');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
};

// Get all addresses for the authenticated user
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const addresses = await Address.find({ userId: req.session.userId });
        res.json(addresses);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ error: 'Error fetching addresses' });
    }
});

// Create a new address
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const address = new Address({
            ...req.body,
            userId: req.session.userId
        });
        await address.save();
        res.status(201).json(address);
    } catch (error) {
        console.error('Error creating address:', error);
        res.status(500).json({ error: 'Error creating address' });
    }
});

// Get a specific address
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            userId: req.session.userId
        });
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }
        res.json(address);
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).json({ error: 'Error fetching address' });
    }
});

// Update an address
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const address = await Address.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            req.body,
            { new: true }
        );
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }
        res.json(address);
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ error: 'Error updating address' });
    }
});

// Delete an address
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const address = await Address.findOneAndDelete({
            _id: req.params.id,
            userId: req.session.userId
        });
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }
        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ error: 'Error deleting address' });
    }
});

module.exports = router;