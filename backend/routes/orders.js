const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const { sendOrderStatusEmail } = require('../services/emailService');
const {
  getRazorpayInstance,
  getRazorpayKeyId,
  isRazorpayConfigured,
  verifyPaymentSignature,
} = require('../config/razorpay');

// GET /api/orders/config — public payment gateway configuration
router.get('/config', (req, res) => {
  res.json({
    configured: isRazorpayConfigured(),
    key_id: getRazorpayKeyId(),
    currency: 'INR',
  });
});

// POST /api/orders/create-razorpay-order
// Prepares a pending order in database and creates the Razorpay server order with amount in paise
router.post('/create-razorpay-order', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { customer_name, phone, address, city, pincode } = req.body;

    if (!customer_name || !phone || !address || !city || !pincode) {
      connection.release();
      return res.status(400).json({ error: 'customer_name, phone, address, city, and pincode are required' });
    }

    const phoneRegex = /^(\+91)?[0-9]{10}$/;
    if (!phoneRegex.test(String(phone).trim())) {
      connection.release();
      return res.status(400).json({ error: 'Enter a valid 10-digit phone number, with or without +91' });
    }

    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(String(pincode).trim())) {
      connection.release();
      return res.status(400).json({ error: 'Enter a valid 6-digit pincode' });
    }

    // Verify Razorpay configuration
    if (!isRazorpayConfigured()) {
      connection.release();
      return res.status(503).json({
        error: 'Razorpay payment gateway is not configured on this server. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend environment variables.',
        code: 'RAZORPAY_NOT_CONFIGURED',
      });
    }

    const razorpay = getRazorpayInstance();
    const keyId = getRazorpayKeyId();

    // 1. Fetch cart items joined with real products table from DB for trusted pricing
    const [cartRows] = await connection.query(
      `SELECT ci.quantity, p.id AS product_id, p.name, p.price, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.session_id = ?`,
      [req.sessionID]
    );

    if (cartRows.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Cart is empty or items are no longer available' });
    }

    // 2. Validate current inventory stock
    for (const item of cartRows) {
      if (item.stock < item.quantity) {
        connection.release();
        return res.status(400).json({
          error: `Insufficient stock for "${item.name}". Only ${item.stock} item(s) currently available.`,
        });
      }
    }

    // 3. Compute trusted total from DB prices
    const total = cartRows.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const amountInPaise = Math.round(total * 100);

    if (amountInPaise <= 0) {
      connection.release();
      return res.status(400).json({ error: 'Order total must be greater than zero.' });
    }

    await connection.beginTransaction();

    const userId = req.session?.userId || null;
    let customerEmail = null;

    if (req.body.customer_email || req.body.email) {
      const inputEmail = String(req.body.customer_email || req.body.email).trim().toLowerCase();
      if (inputEmail && inputEmail.includes('@')) {
        customerEmail = inputEmail;
      }
    }

    if (!customerEmail && userId) {
      try {
        const [[userRow]] = await connection.query('SELECT email FROM users WHERE id = ?', [userId]);
        if (userRow?.email) customerEmail = String(userRow.email).trim().toLowerCase();
      } catch (userErr) {
        console.warn('[Orders] Could not fetch user email for order:', userErr.message);
      }
    }

    // 4. Create pending order in database
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        session_id, user_id, customer_name, customer_email, phone, address, city, pincode,
        total_amount, status, payment_status, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', 'razorpay')`,
      [req.sessionID, userId, customer_name, customerEmail, phone, address, city, pincode, total]
    );
    const orderId = orderResult.insertId;

    // 5. Insert order line items
    for (const item of cartRows) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.price, item.quantity]
      );
    }

    // 6. Create official Razorpay order with currency INR and amount in paise
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${orderId}_${Date.now()}`.slice(0, 40),
      notes: {
        order_id: String(orderId),
        customer_name: String(customer_name).slice(0, 40),
        customer_email: String(customerEmail || '').slice(0, 40),
        customer_phone: String(phone).slice(0, 20),
      },
    });

    // 7. Associate razorpay_order_id with the order
    await connection.query('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [
      razorpayOrder.id,
      orderId,
    ]);

    await connection.commit();
    connection.release();

    res.status(201).json({
      order_id: orderId,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: keyId,
      customer: {
        name: customer_name,
        email: customerEmail,
        phone: phone,
      },
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('[Orders] Razorpay order creation error:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment order' });
  }
});

// POST /api/orders/verify-payment
// Server-side cryptographic HMAC-SHA256 signature verification, inventory decrement, cart clearance,
// and Brevo confirmation email trigger
router.post('/verify-payment', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      connection.release();
      return res.status(400).json({
        error: 'order_id, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
      });
    }

    // 1. Fetch order from DB
    const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ?', [order_id]);
    if (orderRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orderRows[0];

    // 2. Prevent duplicate processing (Idempotency)
    if (order.payment_status === 'paid' && order.status === 'confirmed') {
      connection.release();
      console.log(`[Orders] Duplicate verification request for Order #${order.id}. Returning existing confirmation.`);
      return res.json({
        success: true,
        duplicate: true,
        order_id: order.id,
        total: order.total_amount,
        message: 'Order is already verified and confirmed',
      });
    }

    // 3. Verify Razorpay order ID match
    if (order.razorpay_order_id && order.razorpay_order_id !== razorpay_order_id) {
      connection.release();
      console.warn(`[Orders] Order #${order.id} razorpay_order_id mismatch: expected ${order.razorpay_order_id}, got ${razorpay_order_id}`);
      return res.status(400).json({ error: 'Razorpay order ID mismatch' });
    }

    // 4. Verify cryptographic signature using secret key
    const isValidSignature = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValidSignature) {
      await connection.query('UPDATE orders SET payment_status = ? WHERE id = ?', ['failed', order.id]);
      connection.release();
      console.warn(`[Orders] Cryptographic signature verification failed for Order #${order.id}`);
      return res.status(400).json({ error: 'Payment signature verification failed. Untrusted payment attempt.' });
    }

    // 5. Secondary check: Fetch payment from Razorpay API to check amount & status
    try {
      if (isRazorpayConfigured()) {
        const razorpay = getRazorpayInstance();
        const paymentInfo = await razorpay.payments.fetch(razorpay_payment_id);

        const expectedAmountPaise = Math.round(Number(order.total_amount) * 100);
        if (Number(paymentInfo.amount) !== expectedAmountPaise) {
          await connection.query('UPDATE orders SET payment_status = ? WHERE id = ?', ['failed', order.id]);
          connection.release();
          console.error(`[Orders] Amount mismatch for Order #${order.id}: expected ${expectedAmountPaise} paise, got ${paymentInfo.amount} paise`);
          return res.status(400).json({ error: 'Payment amount mismatch detected. Order rejected.' });
        }

        if (paymentInfo.status !== 'captured' && paymentInfo.status !== 'authorized') {
          await connection.query('UPDATE orders SET payment_status = ? WHERE id = ?', ['failed', order.id]);
          connection.release();
          return res.status(400).json({
            error: `Payment is not in captured/authorized state (status: ${paymentInfo.status})`,
          });
        }
      }
    } catch (apiErr) {
      console.warn('[Orders] Razorpay secondary fetch notice:', apiErr.message);
    }

    // 6. Begin transaction to finalize order, decrement stock, and clear cart
    await connection.beginTransaction();

    // Fetch line items for this order to deduct stock
    const [lineItems] = await connection.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [order.id]
    );

    for (const item of lineItems) {
      await connection.query(
        'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart for the session
    await connection.query('DELETE FROM cart_items WHERE session_id = ?', [req.sessionID]);

    // Update order status to 'confirmed' and payment_status to 'paid'
    await connection.query(
      `UPDATE orders 
       SET status = 'confirmed',
           payment_status = 'paid',
           razorpay_order_id = ?,
           razorpay_payment_id = ?,
           razorpay_signature = ?
       WHERE id = ?`,
      [razorpay_order_id, razorpay_payment_id, razorpay_signature, order.id]
    );

    await connection.commit();
    connection.release();

    // 7. Trigger Brevo confirmation email only after verified successful payment
    console.log(`[Orders] Payment verified! Triggering confirmation email for Order #${order.id}`);
    sendOrderStatusEmail(order.id, 'confirmed').catch((emailErr) => {
      console.warn(`[Orders] Background confirmation email dispatch error for Order #${order.id}:`, emailErr.message);
    });

    res.json({
      success: true,
      order_id: order.id,
      total: order.total_amount,
      message: 'Payment verified successfully. Order confirmed.',
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('[Orders] Verify payment error:', err);
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
});

// POST /api/orders/payment-failed
// Records client payment failure or cancellation without deducting stock or triggering confirmation email
router.post('/payment-failed', async (req, res) => {
  try {
    const { order_id, error_code, error_description } = req.body;
    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    const [orderRows] = await pool.query('SELECT id, status, payment_status FROM orders WHERE id = ?', [order_id]);
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRows[0];
    if (order.payment_status !== 'paid') {
      await pool.query(
        'UPDATE orders SET payment_status = ? WHERE id = ?',
        ['failed', order.id]
      );
      console.log(`[Orders] Payment failure recorded for Order #${order.id}: ${error_description || error_code || 'Cancelled by user'}`);
    }

    res.json({ success: true, message: 'Payment failure status recorded' });
  } catch (err) {
    console.error('[Orders] Payment failed handler error:', err);
    res.status(500).json({ error: 'Failed to record payment status' });
  }
});

// POST /api/orders — fallback direct checkout (turns current session's cart into an order)
// Body: { customer_name, phone, address, city, pincode }
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { customer_name, phone, address, city, pincode } = req.body;

    if (!customer_name || !phone || !address || !city || !pincode) {
      connection.release();
      return res.status(400).json({ error: 'customer_name, phone, address, city, and pincode are required' });
    }

    const phoneRegex = /^(\+91)?[0-9]{10}$/;
    if (!phoneRegex.test(String(phone).trim())) {
      connection.release();
      return res.status(400).json({ error: 'Enter a valid 10-digit phone number, with or without +91' });
    }

    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(String(pincode).trim())) {
      connection.release();
      return res.status(400).json({ error: 'Enter a valid 6-digit pincode' });
    }

    const [cartRows] = await connection.query(
      `SELECT ci.quantity, p.id AS product_id, p.name, p.price, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.session_id = ?`,
      [req.sessionID]
    );

    if (cartRows.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Cart is empty or items are no longer available' });
    }

    const total = cartRows.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    await connection.beginTransaction();

    const userId = req.session?.userId || null;
    let customerEmail = null;

    // Prioritize the email explicitly entered during checkout
    if (req.body.customer_email || req.body.email) {
      const inputEmail = String(req.body.customer_email || req.body.email).trim().toLowerCase();
      if (inputEmail && inputEmail.includes('@')) {
        customerEmail = inputEmail;
      }
    }

    // Fallback: If not explicitly provided, use the registered user's account email
    if (!customerEmail && userId) {
      try {
        const [[userRow]] = await connection.query('SELECT email FROM users WHERE id = ?', [userId]);
        if (userRow?.email) customerEmail = String(userRow.email).trim().toLowerCase();
      } catch (userErr) {
        console.warn('Could not fetch user email for order:', userErr.message);
      }
    }

    const [orderResult] = await connection.query(
      `INSERT INTO orders (session_id, user_id, customer_name, customer_email, phone, address, city, pincode, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.sessionID, userId, customer_name, customerEmail, phone, address, city, pincode, total]
    );
    const orderId = orderResult.insertId;

    for (const item of cartRows) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.price, item.quantity]
      );

      // Decrement stock in database
      await connection.query(
        'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.query('DELETE FROM cart_items WHERE session_id = ?', [req.sessionID]);

    await connection.commit();
    connection.release();

    // Send order confirmation email immediately upon order creation in real time
    console.log(`[Orders] Real-time checkout: Triggering confirmation email for Order #${orderId}`);
    sendOrderStatusEmail(orderId, 'confirmed').catch((err) => {
      console.warn(`[Orders] Background order confirmation email error for Order #${orderId}:`, err.message);
    });

    res.status(201).json({ order_id: orderId, total, message: 'Order placed' });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// GET /api/orders/mine — customer: list own order history with line items
router.get('/mine', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required to view order history' });
  }

  try {
    const [orders] = await pool.query(
      `SELECT id, customer_name, phone, address, city, pincode, total_amount, status, payment_status, payment_method, razorpay_order_id, razorpay_payment_id, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.session.userId]
    );

    if (orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map((o) => o.id);
    const [items] = await pool.query(
      `SELECT order_id, product_id, product_name, price, quantity
       FROM order_items
       WHERE order_id IN (?)`,
      [orderIds]
    );

    const itemsByOrder = items.reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {});

    const enrichedOrders = orders.map((order) => ({
      ...order,
      items: itemsByOrder[order.id] || [],
    }));

    res.json(enrichedOrders);
  } catch (err) {
    console.error('Failed to fetch customer orders:', err);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

// GET /api/orders — admin: list all orders (most recent first)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id — admin: single order with line items
router.get('/:id', requireAdmin, async (req, res) => {
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
// Body: { status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded', trackingNumber?, trackingUrl? }
router.put('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, trackingNumber, trackingUrl } = req.body;
    const targetStatus = String(status || '').toLowerCase().trim();

    console.log(`[Admin Orders] Status update request received for Order #${req.params.id} (target: "${targetStatus}")`);

    const validStatuses = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded',
    ];

    if (!validStatuses.includes(targetStatus)) {
      console.warn(`[Admin Orders] Invalid status rejected for Order #${req.params.id}: "${status}"`);
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    // 1. Fetch existing order to check previous status
    const [orderRows] = await pool.query('SELECT id, status, customer_name, user_id FROM orders WHERE id = ?', [req.params.id]);
    if (orderRows.length === 0) {
      console.warn(`[Admin Orders] Order #${req.params.id} not found.`);
      return res.status(404).json({ error: 'Order not found' });
    }
    const oldStatus = String(orderRows[0].status || '').toLowerCase().trim();

    // 2. Update order status in database
    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [targetStatus, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 3. If old status !== new status: trigger customer email notification safely
    if (oldStatus !== targetStatus) {
      console.log(`[Admin Orders] Status changed for Order #${req.params.id}: "${oldStatus}" -> "${targetStatus}". Triggering notification.`);
      // Background dispatch: email failure NEVER rolls back or blocks the database update
      sendOrderStatusEmail(req.params.id, targetStatus, { trackingNumber, trackingUrl }).catch((emailErr) => {
        console.error(`[Admin Orders] Background email dispatch error for Order #${req.params.id}:`, emailErr.message || emailErr);
      });
    } else {
      console.log(`[Admin Orders] Order #${req.params.id} status unchanged ("${oldStatus}"). Skipping email dispatch.`);
    }

    res.json({ message: 'Order status updated' });
  } catch (err) {
    console.error(`[Admin Orders] Failed to update status for Order #${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
