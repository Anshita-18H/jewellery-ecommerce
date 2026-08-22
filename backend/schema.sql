-- Jewellery E-Commerce Database Schema
-- Run this once to create the database, tables, and sample data.
-- Usage: mysql -u root -p < schema.sql


CREATE DATABASE IF NOT EXISTS jewellery_db;
USE jewellery_db;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(500) DEFAULT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_item (session_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255),
  customer_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  product_name VARCHAR(150) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

INSERT INTO categories (name, slug) VALUES
  ('Rings', 'rings'),
  ('Necklaces', 'necklaces'),
  ('Earrings', 'earrings'),
  ('Bracelets', 'bracelets'),
  ('Bridal', 'bridal');

INSERT INTO products (category_id, name, slug, description, price, stock, image_url, is_featured) VALUES
  (1, 'Rose Gold Solitaire Ring', 'rose-gold-solitaire-ring', 'Elegant rose gold ring with a solitaire cut stone, perfect for everyday wear.', 4999.00, 12, 'https://images.unsplash.com/photo-1551811040-f13e57351ef3?w=800&auto=format&fit=crop&q=80', TRUE),
  (1, 'Classic Gold Band', 'classic-gold-band', 'Timeless plain gold band, hallmark certified.', 8999.00, 8, 'https://images.unsplash.com/photo-1551811040-f13e57351ef3?w=800&auto=format&fit=crop&q=80', FALSE),
  (2, 'Layered Pearl Necklace', 'layered-pearl-necklace', 'Multi-layer necklace with freshwater pearls.', 6499.00, 10, 'https://images.unsplash.com/photo-1758995115682-1452a1a9e35b?w=800&auto=format&fit=crop&q=80', TRUE),
  (2, 'Temple Design Necklace', 'temple-design-necklace', 'Traditional temple-style necklace, festive wear.', 15999.00, 5, 'https://images.unsplash.com/photo-1758995115682-1452a1a9e35b?w=800&auto=format&fit=crop&q=80', FALSE),
  (3, 'Kundan Drop Earrings', 'kundan-drop-earrings', 'Handcrafted kundan earrings with pearl drops.', 3499.00, 20, 'https://images.unsplash.com/photo-1680968921717-4abbbe793bb3?w=800&auto=format&fit=crop&q=80', TRUE),
  (3, 'Minimalist Gold Studs', 'minimalist-gold-studs', 'Everyday studs in polished gold finish.', 1999.00, 25, 'https://images.unsplash.com/photo-1680968921717-4abbbe793bb3?w=800&auto=format&fit=crop&q=80', FALSE),
  (4, 'Charm Bracelet', 'charm-bracelet', 'Delicate chain bracelet with hanging charms.', 2799.00, 15, 'https://images.unsplash.com/photo-1602527418456-8b5cd2c7a4c2?w=800&auto=format&fit=crop&q=80', FALSE),
  (5, 'Bridal Kundan Set', 'bridal-kundan-set', 'Complete bridal set: necklace, earrings, and maang tikka.', 24999.00, 3, 'https://images.unsplash.com/photo-1758995115682-1452a1a9e35b?w=800&auto=format&fit=crop&q=80', TRUE);

  