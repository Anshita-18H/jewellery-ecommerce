const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const ratingsRoutes = require('./routes/ratings');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const wishlistRoutes = require('./routes/wishlist');

const app = express();

// Allow the React frontend (running on a different port) to call this API
// and to send/receive the session cookie.
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://anshita-18h.github.io',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Session setup — gives each visitor a cookie-based ID so their cart
// persists across page refreshes. No login/password involved.

app.set('trust proxy', 1);

const isProduction = process.env.NODE_ENV === 'production';

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    },
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products/:productId/ratings', ratingsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Jewellery e-commerce API is running' });
});

const pool = require('./config/db');

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(30) DEFAULT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT NOT NULL,
        review_text TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_product_user_rating (product_id, user_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token_hash (token_hash),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM wishlist_items LIKE 'user_id'`);
      if (cols.length === 0) {
        await pool.query(`DROP TABLE IF EXISTS wishlist_items`);
      }
    } catch {
      // Table doesn't exist yet, proceed
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_wishlist_item (user_id, product_id)
      )
    `);

    try {
      const [productCols] = await pool.query(`SHOW COLUMNS FROM products LIKE 'occasion_tags'`);
      if (productCols.length === 0) {
        await pool.query(`ALTER TABLE products ADD COLUMN occasion_tags VARCHAR(255) DEFAULT NULL`);
        console.log('Added occasion_tags column to products table');
      }
    } catch (err) {
      console.warn('Could not verify occasion_tags column on products:', err.message);
    }

    try {
      const [genderCols] = await pool.query(`SHOW COLUMNS FROM products LIKE 'gender_tag'`);
      if (genderCols.length === 0) {
        await pool.query(`ALTER TABLE products ADD COLUMN gender_tag VARCHAR(20) DEFAULT NULL`);
        console.log('Added gender_tag column to products table');
      }
    } catch (err) {
      console.warn('Could not verify gender_tag column on products:', err.message);
    }

    try {
      const [orderCols] = await pool.query(`SHOW COLUMNS FROM orders LIKE 'user_id'`);
      if (orderCols.length === 0) {
        await pool.query(`
          ALTER TABLE orders
          ADD COLUMN user_id INT DEFAULT NULL AFTER session_id,
          ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        `);
        console.log('Added user_id column to orders table');
      }
    } catch (err) {
      console.warn('Could not verify user_id column on orders:', err.message);
    }

    try {
      const [emailCols] = await pool.query(`SHOW COLUMNS FROM orders LIKE 'customer_email'`);
      if (emailCols.length === 0) {
        await pool.query(`ALTER TABLE orders ADD COLUMN customer_email VARCHAR(150) DEFAULT NULL AFTER customer_name`);
        console.log('Added customer_email column to orders table');
      }
    } catch (err) {
      console.warn('Could not verify customer_email column on orders:', err.message);
    }

    try {
      await pool.query(`ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'`);
    } catch (err) {
      console.warn('Could not verify status column type on orders:', err.message);
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS order_email_notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          status VARCHAR(50) NOT NULL,
          email VARCHAR(150) NOT NULL,
          resend_id VARCHAR(100) DEFAULT NULL,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_order_status_email (order_id, status),
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } catch (err) {
      console.warn('Could not verify order_email_notifications table:', err.message);
    }

    try {
      const [heroCols] = await pool.query(`SHOW COLUMNS FROM products LIKE 'is_hero_banner'`);
      if (heroCols.length === 0) {
        await pool.query(`ALTER TABLE products ADD COLUMN is_hero_banner BOOLEAN DEFAULT FALSE AFTER is_featured`);
        console.log('Added is_hero_banner column to products table');
      }
    } catch (err) {
      console.warn('Could not verify is_hero_banner column on products:', err.message);
    }

    try {
      const [coverCols] = await pool.query(`SHOW COLUMNS FROM products LIKE 'section_cover'`);
      if (coverCols.length === 0) {
        await pool.query(`ALTER TABLE products ADD COLUMN section_cover VARCHAR(50) DEFAULT NULL AFTER is_hero_banner`);
        console.log('Added section_cover column to products table');
      }
    } catch (err) {
      console.warn('Could not verify section_cover column on products:', err.message);
    }

    try {
      const [galleryCols] = await pool.query(`SHOW COLUMNS FROM products LIKE 'is_in_gallery'`);
      if (galleryCols.length === 0) {
        await pool.query(`ALTER TABLE products ADD COLUMN is_in_gallery BOOLEAN DEFAULT FALSE AFTER is_hero_banner`);
        console.log('Added is_in_gallery column to products table');
      }
    } catch (err) {
      console.warn('Could not verify is_in_gallery column on products:', err.message);
    }

    console.log('Database tables verified successfully');
  } catch (err) {
    console.warn('Database table verification notice:', err.message);
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await initDatabase();
});