const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer'); // For sending emails from contact form

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' folder
// Assume all HTML, CSS, JS, images are placed in a 'public' directory

// For simplicity, we'll log contacts to a file. In production, use a database like MongoDB.
// Also, configure nodemailer for email sending. Replace with your credentials.

// Nodemailer transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or use SMTP for other services
  auth: {
    user: 'harikrishnay09@gmail.com', // Replace with your email
    pass: '34442' // Use app password if 2FA enabled
  }
});

// Routes

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mainpage.html'));
});

// Bag categories page
app.get('/bagcategories', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bagcatogories.html'));
});

// Accessories page
app.get('/accessories', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'accessories.html'));
});

// Contact page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// Products page (assuming products.html exists; if not, redirect or create)
app.get('/products', (req, res) => {
  // If products.html is not provided, serve mainpage or create a placeholder
  res.sendFile(path.join(__dirname, 'public', 'products.html')); // Assume it's there or add content
});

// Cart page (cart.html not provided, so create a simple one dynamically or serve placeholder)
app.get('/cart', (req, res) => {
  // For now, send a placeholder HTML. In real, integrate with DB for persistent cart.
  const cartHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cart - V LADY</title>
      <link rel="stylesheet" href="style.css"> <!-- Adjust CSS as needed -->
    </head>
    <body>
      <header>
        <!-- Header content similar to other pages -->
        <div class="logo">V LADY</div>
        <nav>
          <ul class="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/products">Products</a></li>
            <li><a href="/accessories">Accessories</a></li>
            <li><a href="/contact">Contact Us</a></li>
          </ul>
        </nav>
      </header>
      <section class="cart-section">
        <h2>Your Cart</h2>
        <p>Cart items will be displayed here. Currently using localStorage in frontend.</p>
        <!-- You can add JS to render cart from localStorage -->
        <script src="script.js"></script>
        <script>
          // Example: Render cart from localStorage
          const cart = JSON.parse(localStorage.getItem('cart')) || [];
          document.body.innerHTML += '<ul>' + cart.map(item => '<li>' + item.name + ' - ₹' + item.totalPrice + ' (Qty: ' + item.quantity + ')</li>').join('') + '</ul>';
        </script>
      </section>
      <footer>
        © 2025 V Lady. All rights reserved.
      </footer>
    </body>
    </html>
  `;
  res.send(cartHtml);
});

// Handle contact form submission
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  // Log to file (simple storage)
  const logEntry = `Name: ${name}, Email: ${email}, Message: ${message}\n`;
  fs.appendFile('contacts.log', logEntry, (err) => {
    if (err) console.error('Error logging contact:', err);
  });

  // Send email notification
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: 'studenthari7@gmail.com', // Replace with admin email
    subject: 'New Contact Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send('Error sending message');
    }
    console.log('Email sent:', info.response);
    res.redirect('/contact?success=true'); // Redirect with success param
  });
});

// API for products (if you want dynamic products; currently static in HTML)
// For now, a simple GET /api/products returning hardcoded data
app.get('/api/products', (req, res) => {
  const products = [
    { name: 'Bag 1', price: 99, image: 'bag1.jpg', description: 'Premium leather bag perfect for everyday use.' },
    { name: 'Bag 2', price: 120, image: 'bag2.jpg', description: 'Elegant and spacious bag for stylish outings.' },
    // Add more from frontend
  ];
  res.json(products);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});