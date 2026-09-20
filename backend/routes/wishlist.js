const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Wishlist requires authenticated customer session (req.session.userId).
// If visitor is not logged in, return 401 Unauthorized.
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Please sign in to access your wishlist' });
  }
  next();
}

router.use(requireAuth);

// GET /api/wishlist — get all products wishlisted by the logged-in customer
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.category_id, p.name, p.slug, p.description, p.price, p.stock, p.image_url,
              c.name AS category_name, c.slug AS category_slug,
              wi.created_at AS wishlisted_at
       FROM wishlist_items wi
       JOIN products p ON wi.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE wi.user_id = ?
       ORDER BY wi.created_at DESC`,
      [req.session.userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Fetch wishlist error:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// POST /api/wishlist — add a product to the user's wishlist
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
      `INSERT INTO wishlist_items (user_id, product_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
      [req.session.userId, product_id]
    );

    res.status(201).json({ message: 'Added to wishlist' });
  } catch (err) {
    console.error('Add to wishlist error:', err);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE /api/wishlist/:productId — remove a single product from user's wishlist
router.delete('/:productId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?',
      [req.session.userId, req.params.productId]
    );
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Remove from wishlist error:', err);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// DELETE /api/wishlist — clear all items from user's wishlist
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM wishlist_items WHERE user_id = ?', [req.session.userId]);
    res.json({ message: 'Wishlist cleared' });
  } catch (err) {
    console.error('Clear wishlist error:', err);
    res.status(500).json({ error: 'Failed to clear wishlist' });
  }
});

module.exports = router;
