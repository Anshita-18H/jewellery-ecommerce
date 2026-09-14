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

// GET /api/admin/customers — List registered customers
router.get('/customers', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin customers fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch customer accounts' });
  }
});

module.exports = router;

