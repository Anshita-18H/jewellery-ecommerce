const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

// Protect all admin endpoints — requires authenticated session with role='admin'
router.use(requireAdmin);

// GET /api/admin/dashboard — Real aggregated analytics from MySQL
router.get('/dashboard', async (req, res) => {
  try {
    // 1. Core metric counts
    const [[prodCount]] = await pool.query('SELECT COUNT(*) AS count FROM products');
    const [[orderCount]] = await pool.query('SELECT COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS revenue FROM orders');
    const [[userCount]] = await pool.query('SELECT COUNT(*) AS count FROM users');
    const [[ratingCount]] = await pool.query('SELECT COUNT(*) AS count, COALESCE(ROUND(AVG(rating), 1), 0) AS avg_rating FROM product_ratings');

    // 2. Low stock items (stock <= 5)
    const [lowStock] = await pool.query(
      'SELECT id, name, slug, price, stock, image_url FROM products WHERE stock <= 5 ORDER BY stock ASC LIMIT 6'
    );

    // 3. Top rated products
    const [topRated] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.price, p.image_url,
              ROUND(AVG(pr.rating), 1) AS avg_rating,
              COUNT(pr.id) AS rating_count
       FROM products p
       JOIN product_ratings pr ON p.id = pr.product_id
       GROUP BY p.id
       ORDER BY avg_rating DESC, rating_count DESC
       LIMIT 5`
    );

    // 4. Recent orders
    const [recentOrders] = await pool.query(
      'SELECT id, customer_name, total_amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5'
    );

    // 5. Recent reviews
    const [recentReviews] = await pool.query(
      `SELECT pr.id, pr.rating, pr.review_text, pr.created_at,
              p.name AS product_name, p.slug AS product_slug,
              u.name AS customer_name
       FROM product_ratings pr
       JOIN products p ON pr.product_id = p.id
       JOIN users u ON pr.user_id = u.id
       ORDER BY pr.created_at DESC
       LIMIT 5`
    );

    res.json({
      metrics: {
        totalProducts: Number(prodCount.count) || 0,
        totalOrders: Number(orderCount.count) || 0,
        totalRevenue: Number(orderCount.revenue) || 0,
        totalCustomers: Number(userCount.count) || 0,
        totalReviews: Number(ratingCount.count) || 0,
        averageRating: Number(ratingCount.avg_rating) || 0,
      },
      lowStock,
      topRated,
      recentOrders,
      recentReviews,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'Unable to load dashboard data' });
  }
});

// GET /api/admin/reviews — List all customer reviews
router.get('/reviews', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pr.id, pr.rating, pr.review_text, pr.created_at, pr.updated_at,
              p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
              u.id AS user_id, u.name AS customer_name, u.email AS customer_email
       FROM product_ratings pr
       JOIN products p ON pr.product_id = p.id
       JOIN users u ON pr.user_id = u.id
       ORDER BY pr.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin reviews fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// DELETE /api/admin/reviews/:id — Moderate/remove an inappropriate review
router.delete('/reviews/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM product_ratings WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Admin delete review error:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// GET /api/admin/customers — List registered customers with order stats
router.get('/customers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.phone, 
        u.role, 
        u.google_id,
        u.created_at,
        COUNT(DISTINCT o.id) AS orders_count,
        COALESCE(SUM(o.total_amount), 0) AS total_spent
      FROM users u
      LEFT JOIN orders o ON (o.user_id = u.id OR (o.customer_email IS NOT NULL AND o.customer_email != '' AND LOWER(o.customer_email) = LOWER(u.email)))
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Admin customers fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch customer accounts' });
  }
});

// GET /api/admin/customers/:id — Detailed customer dossier with full order history & line items
router.get('/customers/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const [userRows] = await pool.query(
      'SELECT id, name, email, phone, role, google_id, created_at, updated_at FROM users WHERE id = ?',
      [customerId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = userRows[0];

    // Find all orders placed by this user (by user_id OR email)
    const [orders] = await pool.query(
      `SELECT id, session_id, user_id, customer_name, customer_email, phone, address, city, pincode,
              total_amount, status, payment_status, payment_method, razorpay_order_id, razorpay_payment_id, created_at
       FROM orders
       WHERE user_id = ? OR (customer_email IS NOT NULL AND customer_email != '' AND LOWER(customer_email) = LOWER(?))
       ORDER BY created_at DESC`,
      [customer.id, customer.email]
    );

    // Attach items to each order
    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const [items] = await pool.query(
        `SELECT oi.id, oi.order_id, oi.product_id, oi.product_name, oi.price, oi.quantity,
                p.image_url, p.slug
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id IN (?)`,
        [orderIds]
      );

      const itemsByOrderId = {};
      for (const item of items) {
        if (!itemsByOrderId[item.order_id]) {
          itemsByOrderId[item.order_id] = [];
        }
        itemsByOrderId[item.order_id].push(item);
      }

      for (const order of orders) {
        order.items = itemsByOrderId[order.id] || [];
      }
    }

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    // Determine latest delivery phone & shipping destination from actual orders
    const latestOrderWithPhone = orders.find((o) => o.phone && o.phone.trim());
    const displayPhone = customer.phone || latestOrderWithPhone?.phone || null;

    const latestShippingAddress = orders.length > 0 ? {
      recipient_name: orders[0].customer_name,
      address: orders[0].address,
      city: orders[0].city,
      pincode: orders[0].pincode,
      phone: orders[0].phone,
    } : null;

    res.json({
      customer: {
        ...customer,
        display_phone: displayPhone,
        auth_type: customer.google_id ? 'Google Account' : 'Email & Password',
      },
      stats: {
        total_orders: totalOrders,
        total_spent: totalSpent,
      },
      latest_shipping_address: latestShippingAddress,
      orders,
    });
  } catch (err) {
    console.error('Admin customer details fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch customer profile and order history' });
  }
});

// GET /api/admin/email-logs — View sent transactional email notifications
router.get('/email-logs', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM order_email_notifications ORDER BY sent_at DESC LIMIT 50'
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin email logs fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
});

module.exports = router;

