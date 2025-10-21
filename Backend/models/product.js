const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    images: [{ type: String }], // Array of image URLs
    videos: [{ type: String }], // Array of video URLs
    stock: { type: Number, required: true },
    featured: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);