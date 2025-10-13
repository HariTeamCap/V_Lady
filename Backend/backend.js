// backend.js - Complete Backend for V Lady E-commerce Site

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');

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
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(session({
  secret: 'your-secret-key', // Replace with a secure secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true with HTTPS in production
}));

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
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
    quantity: { type: Number, default: 1, max: 20 }, // Enforce max quantity of 20
    totalPrice: { type: Number }
  }],
  total: { type: Number, default: 0 }
});

const Product = mongoose.model('Product', productSchema);
const Contact = mongoose.model('Contact', contactSchema);
const Cart = mongoose.model('Cart', cartSchema);

// Routes

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mainpage.html'));
});

// Bag categories page
app.get('/bagcategories', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bagcatogories.html'));
});

// Category pages
app.get('/accessories', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Accessories.html'));
});

app.get('/clutches', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Clutches.html'));
});

app.get('/candybags', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Candy_Bags.html'));
});

app.get('/piebags', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Pie_Bags.html'));
});

app.get('/allhandbags', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'All_Handbags.html'));
});

// Contact page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// Cart page
app.get('/cart', async (req, res) => {
  const userId = req.session.id;
  const cart = await Cart.findOne({ userId }).populate('items.productId');
  const cartHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cart - V LADY</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <header>
        <div class="logo">V LADY <div class="tagline">Versatile Lady</div></div>
        <nav>
          <ul class="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/cart">Cart</a></li>
            <li><a href="/contact">Contact Us</a></li>
          </ul>
        </nav>
      </header>
      <section class="cart-section">
        <h2>Your Cart</h2>
        ${cart && cart.items.length > 0 ?
          `<ul>${cart.items.map(item => `
            <li>
              ${item.productId.name} - ₹${item.totalPrice} (Qty: ${item.quantity})
              <button onclick="removeFromCart('${item.productId._id}')">Remove</button>
            </li>`).join('')}</ul>
            <p>Total: ₹${cart.total}</p>
            <button onclick="window.location.href='/checkout'">Proceed to Checkout</button>`
          : '<p>Your cart is empty.</p>'}
      </section>
      <footer class="site-footer">
        <p>© 2025 V Lady. All rights reserved.</p>
      </footer>
      <script>
        async function removeFromCart(productId) {
          await fetch('/api/cart/remove/' + productId, { method: 'DELETE' });
          window.location.reload();
        }
      </script>
    </body>
    </html>
  `;
  res.send(cartHtml);
});

// Contact form submission
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

// Add product (for admin; add authentication in production)
app.post('/api/products', async (req, res) => {
  const { name, description, price, image, category } = req.body;
  try {
    const newProduct = new Product({ name, description, price, image, category });
    await newProduct.save();
    res.json(newProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add to cart (adapted from script.js with quantity limit)
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
      if (newQuantity > 20) {
        return res.status(400).json({ error: 'Maximum quantity of 20 reached' });
      }
      cart.items[itemIndex].quantity = newQuantity;
      cart.items[itemIndex].totalPrice = newQuantity * product.price;
    } else {
      if (quantity > 20) {
        return res.status(400).json({ error: 'Maximum quantity of 20 allowed' });
      }
      cart.items.push({
        productId,
        quantity,
        totalPrice: quantity * product.price
      });
    }

    cart.total = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    await cart.save();

    res.json(cart);
  } catch (error) {
    console.error('Error adding to cart:', error);
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
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Placeholder for checkout (extend as needed)
app.get('/checkout', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Checkout - V LADY</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <header>
        <div class="logo">V LADY <div class="tagline">Versatile Lady</div></div>
        <nav>
          <ul class="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/cart">Cart</a></li>
            <li><a href="/contact">Contact Us</a></li>
          </ul>
        </nav>
      </header>
      <section>
        <h2>Checkout</h2>
        <p>Checkout functionality to be implemented (e.g., payment integration).</p>
      </section>
      <footer class="site-footer">
        <p>© 2025 V Lady. All rights reserved.</p>
      </footer>
    </body>
    </html>
  `);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).send('Page not found');
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
      { name: 'Bag 4', description: 'Compact and trendy bag for daily use.', price: 95, image: 'https://via.placeholder.com/600x600?text=Bag+4+Image+1', category: 'handbag' }
    ];
    await Product.insertMany(initialProducts);
    console.log('Initial products seeded');
  }
})();