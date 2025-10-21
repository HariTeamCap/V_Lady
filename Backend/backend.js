const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

// Route modules
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/products');
const addressRoutes = require('./routes/addresses');
const cartRoutes = require('./routes/cart');

// Middleware
const { isAuthenticated, isAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vlady';

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir, { recursive: true });
}

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, '..', 'Frontend')));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_ORIGIN : 'http://localhost:8080',
  credentials: true
}));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/cart', cartRoutes);

// Fallback to frontend for non-API routes (use middleware to avoid path-to-regexp issues)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'mainpage.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
