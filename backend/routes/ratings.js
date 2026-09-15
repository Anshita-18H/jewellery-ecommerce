const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../config/db');

// Helper to sanitize product ID
function getProductId(req) {
  return req.params.productId || req.productId;
}

// GET /api/products/:productId/ratings — public summary and verified reviews
router.get('/', async (req, res) => {
  try {
    const productId = getProductId(req);
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Verify product exists
    const [productRows] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 1. Efficient aggregate query for average and star counts in a single pass
    const [statsRows] = await pool.query(
      `SELECT
        COUNT(*) AS total_ratings,
        COALESCE(ROUND(AVG(rating), 1), 0) AS average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS stars_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS stars_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS stars_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS stars_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS stars_1
      FROM product_ratings
      WHERE product_id = ?`,
      [productId]
    );

    const stats = statsRows[0] || {};
    const totalRatings = Number(stats.total_ratings) || 0;
    const averageRating = totalRatings > 0 ? Number(stats.average_rating) : 0;

    const distribution = {
      5: Number(stats.stars_5) || 0,
      4: Number(stats.stars_4) || 0,
      3: Number(stats.stars_3) || 0,
      2: Number(stats.stars_2) || 0,
      1: Number(stats.stars_1) || 0,
    };

    // 2. Fetch verified customer reviews (never expose email or passwords)
    const [reviewsRows] = await pool.query(
      `SELECT
        pr.id,
        pr.product_id,
        pr.rating,
        pr.review_text,
        pr.created_at,
        pr.updated_at,
        u.name AS customer_name
      FROM product_ratings pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.product_id = ? AND (pr.review_text IS NOT NULL AND pr.review_text != '')
      ORDER BY pr.created_at DESC
      LIMIT 50`,
      [productId]
    );

    res.json({
      averageRating,
      totalRatings,
      distribution,
      reviews: reviewsRows,
    });
  } catch (err) {
    console.error('Fetch ratings error:', err.message);
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({
        averageRating: 0,
        totalRatings: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        reviews: [],
      });
    }
    res.status(500).json({ error: 'Failed to load product ratings' });
  }
});

// GET /api/products/:productId/ratings/my-rating — get current user's rating
router.get('/my-rating', async (req, res) => {
  try {
    const productId = getProductId(req);
    if (!req.session || !req.session.userId) {
      return res.json({ rating: null, reviewText: '' });
    }

    const [rows] = await pool.query(
      'SELECT id, rating, review_text, created_at, updated_at FROM product_ratings WHERE product_id = ? AND user_id = ?',
      [productId, req.session.userId]
    );

    if (rows.length === 0) {
      return res.json({ rating: null, reviewText: '' });
    }

    const row = rows[0];
    res.json({
      id: row.id,
      rating: Number(row.rating),
      reviewText: row.review_text || '',
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error('Fetch my-rating error:', err.message);
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ rating: null, reviewText: '' });
    }
    res.status(500).json({ error: 'Failed to load your rating' });
  }
});

// POST /api/products/:productId/ratings — submit or update rating (authenticated only)
router.post('/', async (req, res) => {
  try {
    const productId = getProductId(req);

    // Authentication check: must have valid session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Please login to rate this product.' });
    }

    const userId = req.session.userId;
    const { rating, reviewText } = req.body;

    // Validate rating
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Please select a valid rating from 1 to 5 stars.' });
    }

    // Verify product exists
    const [productRows] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const cleanReview = reviewText && typeof reviewText === 'string' ? reviewText.trim().slice(0, 1000) : null;

    // Upsert using ON DUPLICATE KEY UPDATE to prevent duplicate rows
    await pool.query(
      `INSERT INTO product_ratings (product_id, user_id, rating, review_text)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         rating = VALUES(rating),
         review_text = VALUES(review_text),
         updated_at = CURRENT_TIMESTAMP`,
      [productId, userId, parsedRating, cleanReview]
    );

    res.status(201).json({
      message: 'Your rating has been saved successfully.',
      rating: parsedRating,
      reviewText: cleanReview || '',
    });
  } catch (err) {
    console.error('Submit rating error:', err);
    res.status(500).json({ error: 'Unable to submit your rating. Please try again.' });
  }
});

// DELETE /api/products/:productId/ratings — delete own rating
router.delete('/', async (req, res) => {
  try {
    const productId = getProductId(req);

    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Please login to manage your ratings.' });
    }

    const [result] = await pool.query(
      'DELETE FROM product_ratings WHERE product_id = ? AND user_id = ?',
      [productId, req.session.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'You have not rated this product yet.' });
    }

    res.json({ message: 'Your rating has been removed successfully.' });
  } catch (err) {
    console.error('Delete rating error:', err);
    res.status(500).json({ error: 'Failed to delete rating. Please try again.' });
  }
});

module.exports = router;

