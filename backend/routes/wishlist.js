const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Every route here uses req.sessionID — a unique ID express-session
// generates per browser (stored in a cookie). No login required;
// this scopes the wishlist to the specific visitor's session.

// GET /api/wishlist — get all products wishlisted by the current visitor
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.category_id, p.name, p.slug, p.description, p.price, p.stock, p.image_url,
              c.name AS category_name, c.slug AS category_slug,
              wi.created_at AS wishlisted_at
       FROM wishlist_items wi
       JOIN products p ON wi.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE wi.session_id = ?
       ORDER BY wi.created_at DESC`,
      [req.sessionID]
    );

    res.json(rows);
  } catch (err) {
    console.error('Fetch wishlist error:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// POST /api/wishlist — add a product to the visitor's wishlist
// Body: { product_id }
router.post('/', async (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }

    const [products] = await pool.query(
      'SELECT id FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await pool.query(
      `INSERT INTO wishlist_items (session_id, product_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
      [req.sessionID, product_id]
    );

    res.status(201).json({ message: 'Added to wishlist' });
  } catch (err) {
    console.error('Add to wishlist error:', err);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE /api/wishlist/:productId — remove a single product from wishlist
router.delete('/:productId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM wishlist_items WHERE session_id = ? AND product_id = ?',
      [req.sessionID, req.params.productId]
    );
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Remove from wishlist error:', err);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// DELETE /api/wishlist — clear all items from visitor's wishlist
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM wishlist_items WHERE session_id = ?', [req.sessionID]);
    res.json({ message: 'Wishlist cleared' });
  } catch (err) {
    console.error('Clear wishlist error:', err);
    res.status(500).json({ error: 'Failed to clear wishlist' });
  }
});

module.exports = router;

