// backend.js - Complete Backend for V Lady E-commerce Site

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vlady';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Serve the static frontend files from the sibling Frontend directory
app.use(express.static(path.join(__dirname, '..', 'Frontend')));
app.use(cors());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true with HTTPS in production
}));

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// MongoDB Schemas
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, default: 'handbag' }
});

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1, max: 20 },
    totalPrice: { type: Number }
  }],
  total: { type: Number, default: 0 }
});

const wishlistSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
});

const Product = mongoose.model('Product', productSchema);
const Contact = mongoose.model('Contact', contactSchema);
const Cart = mongoose.model('Cart', cartSchema);
const Wishlist = mongoose.model('Wishlist', wishlistSchema);

// Routes

// Home page -> serve Frontend/mainpage.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'mainpage.html'));
});

// Bag categories page
app.get('/bagcategories', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'bagcatogories.html'));
});

// Category pages
app.get('/accessories', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'accessories.html'));
});

app.get('/clutches', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'Clutches.html'));
});

app.get('/candybags', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'Candy_Bags.html'));
});

app.get('/piebags', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pie_Bags.html'));
});

app.get('/allhandbags', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'All_Handbags.html'));
});

// Contact page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'contact.html'));
});

// Product details page
app.get('/productdetails', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'productdetails.html'));
});

// Wishlist page
app.get('/wishlist', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'wishlist.html'));
});

// About page
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'about.html'));
});

// Cart page
app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'cart.html'));
});

// Handle contact form submission
app.post('/contact', async (req, res) => {
  const { name, phone, email, message } = req.body;

  try {
    const newContact = new Contact({ name, phone, email, message });
    await newContact.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'admin@example.com',
      subject: 'New Contact Form Submission',
      text: `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nMessage: ${message}`
    };
    await transporter.sendMail(mailOptions);

    res.redirect('/contact?success=true');
  } catch (error) {
    console.error('Error handling contact:', error);
    res.status(500).send('Error sending message');
  }
});

// API Routes

// Get all products or by category
app.get('/api/products', async (req, res) => {
  const { category } = req.query;
  const filter = category ? { category } : {};
  const products = await Product.find(filter);
  res.json(products);
});

// Add product (admin; secure in production)
app.post('/api/products', async (req, res) => {
  const { name, description, price, image, category } = req.body;
  try {
    const newProduct = new Product({ name, description, price, image, category });
    await newProduct.save();
    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add to cart
app.post('/api/cart/add', async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.session.id;

  try {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + quantity;
      if (newQuantity > 20) return res.status(400).json({ error: 'Max quantity 20' });
      cart.items[itemIndex].quantity = newQuantity;
      cart.items[itemIndex].totalPrice = newQuantity * product.price;
    } else {
      if (quantity > 20) return res.status(400).json({ error: 'Max quantity 20' });
      cart.items.push({ productId, quantity, totalPrice: quantity * product.price });
    }

    cart.total = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get cart
app.get('/api/cart', async (req, res) => {
  const userId = req.session.id;
  const cart = await Cart.findOne({ userId }).populate('items.productId');
  res.json(cart || { items: [], total: 0 });
});

// Remove from cart
app.delete('/api/cart/remove/:productId', async (req, res) => {
  const { productId } = req.params;
  const userId = req.session.id;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    cart.total = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Wishlist APIs
app.post('/api/wishlist/add', async (req, res) => {
  const { productId } = req.body;
  const userId = req.session.id;

  try {
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }

    if (!wishlist.items.some(id => id.toString() === productId)) {
      wishlist.items.push(productId);
    }

    await wishlist.save();
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/wishlist', async (req, res) => {
  const userId = req.session.id;
  const wishlist = await Wishlist.findOne({ userId }).populate('items');
  res.json(wishlist || { items: [] });
});

app.delete('/api/wishlist/remove/:productId', async (req, res) => {
  const { productId } = req.params;
  const userId = req.session.id;

  try {
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });

    wishlist.items = wishlist.items.filter(id => id.toString() !== productId);
    await wishlist.save();
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 404 Handler
app.use((req, res) => {
  // For unknown non-API routes, serve the frontend index (SPA-friendly). For API routes, return 404.
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.status(404).sendFile(path.join(__dirname, '..', 'Frontend', 'mainpage.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Seed initial products
(async () => {
  const count = await Product.countDocuments();
  if (count === 0) {
    const initialProducts = [
      { name: 'Elegant Tote Bag', description: 'Elegant Tote Bag', price: 899, image: 'bag1.jpg', category: 'handbag' },
      { name: 'Classic Sling Bag', description: 'Classic Sling Bag', price: 799, image: 'bag2.jpg', category: 'handbag' },
      { name: 'Leather Handbag', description: 'Leather Handbag', price: 999, image: 'bag3.jpg', category: 'handbag' },
      { name: 'Compact Shoulder Bag', description: 'Compact Shoulder Bag', price: 699, image: 'bag4.jpg', category: 'handbag' },
      { name: 'Beige Classic Bag', description: 'Elegant and soft-touch handbag perfect for daily wear.', price: 999, image: 'https://via.placeholder.com/250', category: 'clutch' },
      { name: 'Pink Heart Purse', description: 'Trendy heart-shaped purse with a shiny finish.', price: 799, image: 'https://via.placeholder.com/250', category: 'clutch' },
      { name: 'White Clutch', description: 'Minimal clutch perfect for special occasions.', price: 1120, image: 'https://via.placeholder.com/250', category: 'clutch' },
      { name: 'Sky Blue Purse', description: 'Soft pastel purse to complement your stylish look.', price: 899, image: 'https://via.placeholder.com/250', category: 'clutch' },
      { name: 'Bag 1', description: 'Premium leather bag perfect for everyday use.', price: 99, image: 'https://via.placeholder.com/600x600?text=Bag+1+Image+1', category: 'handbag' },
      { name: 'Bag 2', description: 'Elegant and spacious bag for stylish outings.', price: 120, image: 'https://via.placeholder.com/600x600?text=Bag+2+Image+1', category: 'handbag' },
      { name: 'Bag 3', description: 'Stylish handbag suitable for any occasion.', price: 110, image: 'https://via.placeholder.com/600x600?text=Bag+3+Image+1', category: 'handbag' },
      { name: 'Bag 4', description: 'Compact and trendy bag for daily use.', price: 95, image: 'https://via.placeholder.com/600x600?text=Bag+4+Image+1', category: 'handbag' },
      { name: 'Elegant Leather Handbag', description: 'This elegant leather handbag is perfect for any occasion.', price: 2499, image: 'https://images.pexels.com/photos/18458794/pexels-photo-18458794.jpeg', category: 'handbag' },
      { name: 'Pie Supreme', description: 'Stylish pie bag.', price: 950, image: 'https://images.pexels.com/photos/20086704/pexels-photo-20086704.jpeg', category: 'piebag' }
    ];
    await Product.insertMany(initialProducts);
    console.log('Initial products seeded');
  }
})();