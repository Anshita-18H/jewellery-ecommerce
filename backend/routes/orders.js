const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// POST /api/orders — checkout: turns the current session's cart into an order
// Body: { customer_name, phone, address, city, pincode }
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { customer_name, phone, address, city, pincode } = req.body;

    if (!customer_name || !phone || !address || !city || !pincode) {
      connection.release();
      return res.status(400).json({ error: 'customer_name, phone, address, city, and pincode are required' });
    }

    const [cartRows] = await connection.query(
      `SELECT ci.quantity, p.id AS product_id, p.name, p.price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.session_id = ?`,
      [req.sessionID]
    );

    if (cartRows.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const total = cartRows.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      `INSERT INTO orders (session_id, customer_name, phone, address, city, pincode, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.sessionID, customer_name, phone, address, city, pincode, total]
    );
    const orderId = orderResult.insertId;

    for (const item of cartRows) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.price, item.quantity]
      );
    }

    await connection.query('DELETE FROM cart_items WHERE session_id = ?', [req.sessionID]);

    await connection.commit();
    connection.release();

    res.status(201).json({ order_id: orderId, total, message: 'Order placed' });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// GET /api/orders — admin: list all orders (most recent first)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id — admin: single order with line items
router.get('/:id', async (req, res) => {
  try {
    const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const [itemRows] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ ...orderRows[0], items: itemRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PUT /api/orders/:id/status — admin: update order status
// Body: { status: 'pending' | 'shipped' | 'delivered' | 'cancelled' }
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
