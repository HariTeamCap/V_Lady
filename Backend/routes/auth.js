const express = require('express');
const router = express.Router();
const User = require('../models/user');
const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
};

// Send OTP for registration/login
router.post('/send-otp', async (req, res) => {
    try {
        const { mobile } = req.body;

        // Validate mobile number format
        if (!/^\+91[1-9]\d{9}$/.test(mobile)) {
            return res.status(400).json({ error: 'Invalid mobile number format' });
        }

        const otp = generateOTP();
        const user = await User.findOneAndUpdate(
            { mobile },
            { 
                $set: {
                    'otp.code': otp,
                    'otp.generatedAt': new Date(),
                    'otp.attempts': 0
                }
            },
            { upsert: true, new: true }
        );

        // If Twilio is configured, send via Twilio. Otherwise use a dev fallback.
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
            await client.messages.create({
                body: `Your V Lady verification code is: ${otp}`,
                to: mobile,
                from: process.env.TWILIO_PHONE_NUMBER
            });
            return res.json({ message: 'OTP sent successfully' });
        } else {
            // Dev fallback: log OTP to server console and return limited info in non-production
            console.warn(`TWILIO not configured - OTP for ${mobile}: ${otp}`);
            const responsePayload = { message: 'OTP generated (dev fallback)' };
            if (process.env.NODE_ENV !== 'production') {
                // Return OTP in response only for local/dev testing
                responsePayload.otp = otp;
            }
            return res.json(responsePayload);
        }
    } catch (error) {
        console.error('OTP send error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Verify OTP and complete registration/login
router.post('/verify-otp', async (req, res) => {
    try {
        const { mobile, otp } = req.body;

        const user = await User.findOne({ mobile });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check OTP expiration (5 minutes)
        const otpAge = (new Date() - user.otp.generatedAt) / 1000 / 60;
        if (otpAge > 5) {
            return res.status(400).json({ error: 'OTP expired' });
        }

        // Check OTP attempts
        if (user.otp.attempts >= 3) {
            return res.status(400).json({ error: 'Too many attempts. Request new OTP' });
        }

        // Verify OTP
        if (user.otp.code !== otp) {
            await User.updateOne(
                { _id: user._id },
                { $inc: { 'otp.attempts': 1 } }
            );
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Mark user as verified and clear OTP
        await User.updateOne(
            { _id: user._id },
            { 
                $set: { 
                    isVerified: true,
                    'otp.code': null,
                    'otp.attempts': 0
                }
            }
        );

        // Set session
        req.session.userId = user._id;

        res.json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

// Update user profile
router.put('/profile', isAuthenticated, async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findByIdAndUpdate(
            req.session.userId,
            { $set: { name, email } },
            { new: true }
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Add address
router.post('/address', isAuthenticated, async (req, res) => {
    try {
        const { type, street, city, state, pincode } = req.body;
        const user = await User.findByIdAndUpdate(
            req.session.userId,
            { $push: { addresses: { type, street, city, state, pincode } } },
            { new: true }
        );
        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add address' });
    }
});

// Update address
router.put('/address/:addressId', isAuthenticated, async (req, res) => {
    try {
        const { type, street, city, state, pincode } = req.body;
        const user = await User.findOneAndUpdate(
            { 
                _id: req.session.userId,
                'addresses._id': req.params.addressId
            },
            { 
                $set: {
                    'addresses.$.type': type,
                    'addresses.$.street': street,
                    'addresses.$.city': city,
                    'addresses.$.state': state,
                    'addresses.$.pincode': pincode
                }
            },
            { new: true }
        );
        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update address' });
    }
});

// Delete address
router.delete('/address/:addressId', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.session.userId,
            { $pull: { addresses: { _id: req.params.addressId } } },
            { new: true }
        );
        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete address' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;