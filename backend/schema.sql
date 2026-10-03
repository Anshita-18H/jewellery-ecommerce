-- =============================================================================
-- AURA Jewellery E-Commerce — Master Database Schema & Seed Data
-- =============================================================================
-- Single source of truth for the entire application.
-- Running this file against an empty MySQL database recreates all required
-- tables in the correct dependency order with full constraints and sample data.
--
-- Local usage:
--   mysql -u root -p < schema.sql
--
-- Aiven Cloud usage:
--   mysql -h <host> -P <port> -u <user> -p <defaultdb> < schema.sql
--   (Note: For cloud databases, ensure you are connected to your target database,
--    or comment out the CREATE DATABASE and USE statements below).
-- =============================================================================

CREATE DATABASE IF NOT EXISTS jewellery_db;
USE jewellery_db;

-- Safely disable foreign key checks during teardown
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS product_ratings;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS wishlist_items;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS categories;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. CATEGORIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. USERS TABLE (Customers & Administrators)
-- Must precede tables that reference user_id (wishlist, ratings, orders)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. PRODUCTS TABLE
-- Includes occasion_tags, gender_tag, and is_active columns
-- =============================================================================
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT DEFAULT NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(500) DEFAULT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  occasion_tags VARCHAR(255) DEFAULT NULL,
  gender_tag VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. CART ITEMS TABLE (Session-based guest / customer shopping carts)
-- =============================================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_item (session_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. WISHLIST ITEMS TABLE (Authenticated customer saved jewellery)
-- =============================================================================
CREATE TABLE IF NOT EXISTS wishlist_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_wishlist_item (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. ORDERS TABLE
-- Includes user_id, payment_status, payment_method, and razorpay_order_id
-- =============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) DEFAULT NULL,
  user_id INT DEFAULT NULL,
  customer_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'card',
  razorpay_order_id VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. ORDER ITEMS TABLE (Individual line items per order)
-- =============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT DEFAULT NULL,
  product_name VARCHAR(150) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. PRODUCT RATINGS & REVIEWS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS product_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_user_rating (product_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. CONTACT MESSAGES TABLE (Concierge / inquiry submissions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 10. PASSWORD RESET TOKENS TABLE
-- Cryptographically secure single-use tokens with expiration
-- =============================================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Master Administrator Account
-- Credentials: admin@aura.com / Admin@Aura2026!
INSERT IGNORE INTO users (name, email, password_hash, phone, role) VALUES
  ('AURA Master Administrator', 'admin@aura.com', '$2b$10$/mfuqJMhh.VgTTerOUAYA.QxIGW5jS8OuzDDnK1NbPaV/njbxqFEy', '+91 98765 43210', 'admin');

-- Categories
INSERT IGNORE INTO categories (name, slug) VALUES
  ('Rings', 'rings'),
  ('Necklaces', 'necklaces'),
  ('Earrings', 'earrings'),
  ('Bracelets', 'bracelets'),
  ('Bridal', 'bridal');

-- Sample Jewellery Products
INSERT IGNORE INTO products (category_id, name, slug, description, price, stock, image_url, is_featured, is_active, occasion_tags, gender_tag) VALUES
  (1, 'Rose Gold Solitaire Ring', 'rose-gold-solitaire-ring', 'Elegant rose gold ring with a solitaire cut stone, perfect for everyday wear.', 4999.00, 12, 'https://images.unsplash.com/photo-1551811040-f13e57351ef3?w=800&auto=format&fit=crop&q=80', TRUE, TRUE, 'everyday,gifting', 'women'),
  (1, 'Classic Gold Band', 'classic-gold-band', 'Timeless plain gold band, hallmark certified.', 8999.00, 8, 'https://images.unsplash.com/photo-1551811040-f13e57351ef3?w=800&auto=format&fit=crop&q=80', FALSE, TRUE, 'everyday,workwear', 'men'),
  (2, 'Layered Pearl Necklace', 'layered-pearl-necklace', 'Multi-layer necklace with freshwater pearls.', 6499.00, 10, 'https://images.unsplash.com/photo-1758995115682-1452a1a9e35b?w=800&auto=format&fit=crop&q=80', TRUE, TRUE, 'party,festive', 'women'),
  (2, 'Temple Design Necklace', 'temple-design-necklace', 'Traditional temple-style necklace, festive wear.', 15999.00, 5, 'https://images.unsplash.com/photo-1758995115682-1452a1a9e35b?w=800&auto=format&fit=crop&q=80', FALSE, TRUE, 'wedding,bridal,festive', 'women'),
  (3, 'Kundan Drop Earrings', 'kundan-drop-earrings', 'Handcrafted kundan earrings with pearl drops.', 3499.00, 20, 'https://images.unsplash.com/photo-1680968921717-4abbbe793bb3?w=800&auto=format&fit=crop&q=80', TRUE, TRUE, 'festive,party', 'women'),
  (3, 'Minimalist Gold Studs', 'minimalist-gold-studs', 'Everyday studs in polished gold finish.', 1999.00, 25, 'https://images.unsplash.com/photo-1680968921717-4abbbe793bb3?w=800&auto=format&fit=crop&q=80', FALSE, TRUE, 'everyday,workwear', 'kids'),
  (4, 'Charm Bracelet', 'charm-bracelet', 'Delicate chain bracelet with hanging charms.', 2799.00, 15, 'https://images.unsplash.com/photo-1602527418456-8b5cd2c7a4c2?w=800&auto=format&fit=crop&q=80', FALSE, TRUE, 'everyday,gifting', 'kids'),
  (5, 'Bridal Kundan Set', 'bridal-kundan-set', 'Complete bridal set: necklace, earrings, and maang tikka.', 24999.00, 3, 'https://images.unsplash.com/photo-1758995115682-1452a1a9e35b?w=800&auto=format&fit=crop&q=80', TRUE, TRUE, 'wedding,bridal', 'women');