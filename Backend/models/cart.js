const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        }
    }],
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true
});

// Middleware to calculate total amount before saving
cartSchema.pre('save', async function(next) {
    try {
        let total = 0;
        for (const item of this.items) {
            const product = await mongoose.model('Product').findById(item.product);
            if (product) {
                total += product.price * item.quantity;
            }
        }
        this.totalAmount = total;
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Cart', cartSchema);