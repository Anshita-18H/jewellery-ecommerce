const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Every route here uses req.sessionID — a unique ID express-session
// generates per browser (stored in a cookie). No login required;
// this is just how we know "which cart belongs to which visitor".

// GET /api/cart — full cart with product details + total
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.name, p.price, p.image_url, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.session_id = ?`,
      [req.sessionID]
    );

    const items = rows.map((r) => ({ ...r, subtotal: Number(r.price) * r.quantity }));
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    res.json({ items, total, item_count: items.reduce((n, i) => n + i.quantity, 0) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart — add a product to the cart (or bump quantity if already in cart)
// Body: { product_id, quantity }
router.post('/', async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const qty = Number(quantity) || 1;

    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }

    await pool.query(
      `INSERT INTO cart_items (session_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.sessionID, product_id, qty]
    );

    res.status(201).json({ message: 'Added to cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// PUT /api/cart/:productId — set an exact quantity (e.g. from a quantity input)
router.put('/:productId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const qty = Number(quantity);

    if (!qty || qty < 1) {
      return res.status(400).json({ error: 'quantity must be at least 1' });
    }

    const [result] = await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE session_id = ? AND product_id = ?',
      [qty, req.sessionID, req.params.productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not in cart' });
    }
    res.json({ message: 'Cart updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// DELETE /api/cart/:productId — remove a single item
router.delete('/:productId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM cart_items WHERE session_id = ? AND product_id = ?',
      [req.sessionID, req.params.productId]
    );
    res.json({ message: 'Item removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// DELETE /api/cart — clear the entire cart (used after checkout)
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE session_id = ?', [req.sessionID]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;
