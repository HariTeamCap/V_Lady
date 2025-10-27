const mongoose = require('mongoose');
const Product = require('./models/product'); // Adjust the path as necessary

// Sample product data
const productsData = [
    {
        name: 'Beige Sling Bag',
        description: 'Stylish and spacious sling bag for everyday use.',
        MRP: 1599,
        price: 799,
        category: 'Pie Bags',
        images: [
            'IMG_6439.HEIC',
            'IMG_6442.HEIC',
            'IMG_6431.HEIC',
            'IMG_6438.HEIC'
        ],
        videos: [],
        stock: 50,
        featured: true
    },
    {
        name: 'White sling bag',
        description: 'Mini Bag, Unique Shapes, Mini Bags, Accent Pop Color, Neon & Pop Colors, Sling Bags',
        MRP: 1699,
        price: 1199,
        category: 'Pie bags',
        images: [
            'Photoroom_20251023_185235.JPG',
            'Photoroom_20251023_184630.JPG',
            'Photoroom_20250902_190934.JPG',
            'Photoroom_20251023_184707.JPG'
            
        ],
        videos: [],
        stock: 50,
        featured: true
    },
    {
        name: 'Pink Sling Bag',
        description: 'Chic, compact, and versatile mini bag designed to add effortless charm to your looks.Despite its petite size, it’s crafted to carry essentials like cards, cash, and lipstick — making it the perfect companion for both day and night outings.',
        MRP: 1699,
        price: 1199,
        category: 'Pie Bags',
        images: [
            'Photoroom_20250922_172733.JPG',
            'Photoroom_20250922_181102.JPG',
            'Photoroom_20250922_180533.JPG',
            'Photoroom_20250922_181222.JPG'
        ],
        videos: [
            'https://example.com/videos/tv-demo.mp4'
        ],
        stock: 30,
        featured: true
    }
];

// Function to connect to DB and seed data
const seedDatabase = async () => {
    try {
        // Connect to your MongoDB database (use your connection string)
        await mongoose.connect('mongodb://localhost:27017/vlady', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('MongoDB connected successfully.');

        // Optional: Clear existing products before seeding
        await Product.deleteMany({});
        console.log('Existing products cleared.');

        // Insert new products
        const createdProducts = await Product.insertMany(productsData);
        console.log(`Seeded ${createdProducts.length} products successfully.`);

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        // Disconnect from the database
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
};

// Run the seed function
// seedDatabase();

module.exports = { productsData };