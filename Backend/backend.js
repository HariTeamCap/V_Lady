// backend.js - Complete Backend for V Lady E-commerce Site

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { registerSchema, loginSchema, productSchema: productValidationSchema, contactSchema: contactValidationSchema, cartSchema: cartValidationSchema, orderSchema: orderValidationSchema } = require('./validators');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vlady';

// Connect to MongoDB (use fallback URI if env var is missing)
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
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

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  shippingAddress: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
const Contact = mongoose.model('Contact', contactSchema);
const Cart = mongoose.model('Cart', cartSchema);
const Wishlist = mongoose.model('Wishlist', wishlistSchema);
const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

// Middleware to check for authentication
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

// Middleware to check for admin privileges
const isAdmin = (req, res, next) => {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
};

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
// Accept frontend form field names (Google Forms style)
app.post('/contact', async (req, res) => {
  const { error } = contactSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  // Map frontend field names to backend schema
  const name = req.body['entry.1111111111'] || req.body.name;
  const phone = req.body['entry.2222222222'] || req.body.phone;
  const email = req.body['entry.3333333333'] || req.body.email;
  const message = req.body['entry.4444444444'] || req.body.message;

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

    // If AJAX, send JSON; if form, redirect
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.json({ success: true });
    } else {
      res.redirect('/contact?success=true');
    }
  } catch (error) {
    console.error('Error handling contact:', error);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(500).json({ error: 'Error sending message' });
    } else {
      res.status(500).send('Error sending message');
    }
  }
});

// API Routes

// User Authentication Routes
app.post('/api/register', async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
});

app.post('/api/login', async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    req.session.userId = user._id;
    req.session.isAdmin = user.isAdmin;
    res.json({ message: 'Logged in successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/user', async (req, res) => {
  if (req.session.userId) {
    const user = await User.findById(req.session.userId).select('-password');
    res.json(user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Get all products or by category
app.get('/api/products', async (req, res) => {
  const { category } = req.query;
  const filter = category ? { category } : {};
  const products = await Product.find(filter);
  res.json(products);
});

// Get a single product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add product (admin only)
app.post('/api/products', isAuthenticated, isAdmin, async (req, res) => {
  const { error } = productSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { name, description, price, image, category } = req.body;
  try {
    const newProduct = new Product({ name, description, price, image, category });
    await newProduct.save();
    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product (admin only)
app.put('/api/products/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { error } = productSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete product (admin only)
app.delete('/api/products/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add to cart
app.post('/api/cart/add', isAuthenticated, async (req, res) => {
  const { error } = cartSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { productId, quantity = 1 } = req.body;
  const userId = req.session.userId;

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

// Update cart item quantity
app.put('/api/cart/update', isAuthenticated, async (req, res) => {
    const { error } = cartSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { productId, quantity } = req.body;
    const userId = req.session.userId;

    try {
        let cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ error: 'Cart not found' });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].totalPrice = quantity * product.price;
            cart.total = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
            await cart.save();
            res.json(cart);
        } else {
            res.status(404).json({ error: 'Item not in cart' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get cart
app.get('/api/cart', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  const cart = await Cart.findOne({ userId }).populate('items.productId');
  res.json(cart || { items: [], total: 0 });
});

// Remove from cart
app.delete('/api/cart/remove/:productId', isAuthenticated, async (req, res) => {
  const { productId } = req.params;
  const userId = req.session.userId;

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
app.post('/api/wishlist/add', isAuthenticated, async (req, res) => {
  const { productId } = req.body;
  const userId = req.session.userId;

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

app.get('/api/wishlist', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  const wishlist = await Wishlist.findOne({ userId }).populate('items');
  res.json(wishlist || { items: [] });
});

app.delete('/api/wishlist/remove/:productId', isAuthenticated, async (req, res) => {
  const { productId } = req.params;
  const userId = req.session.userId;

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

// Order APIs
app.post('/api/orders', isAuthenticated, async (req, res) => {
  const { error } = orderSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { shippingAddress } = req.body;
  const userId = req.session.userId;

  try {
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const order = new Order({
      userId,
      items: cart.items.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price
      })),
      total: cart.total,
      shippingAddress
    });

    await order.save();

    // Clear the cart
    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error creating order' });
  }
});

app.get('/api/orders', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  try {
    const orders = await Order.find({ userId }).populate('items.productId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
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
