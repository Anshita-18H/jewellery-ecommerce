require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

const app = express();

// Allow the React frontend (running on a different port) to call this API
// and to send/receive the session cookie.
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

// Session setup — gives each visitor a cookie-based ID so their cart
// persists across page refreshes. No login/password involved.
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: false, // set to true once deployed behind HTTPS
    },
  })
);

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Jewellery e-commerce API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});