const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Helper: turn a product name into a URL-friendly slug
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/products
// Supports optional query params: ?category=rings&search=gold&featured=true
router.get('/', async (req, res) => {
  try {
    const { category, search, featured } = req.query;

    let sql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1 = 1
    `;
    const params = [];

    if (category) {
      sql += ' AND c.slug = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (featured === 'true') {
      sql += ' AND p.is_featured = TRUE';
    }

    sql += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:slug — single product detail page
router.get('/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ?`,
      [req.params.slug]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products — admin: add a new product
// Body: { name, category_id, description, price, stock, image_url, is_featured }
router.post('/', async (req, res) => {
  try {
    const { name, category_id, description, price, stock, image_url, is_featured } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'name and price are required' });
    }

    const slug = slugify(name);

    const [result] = await pool.query(
      `INSERT INTO products (category_id, name, slug, description, price, stock, image_url, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id || null,
        name,
        slug,
        description || '',
        price,
        stock || 0,
        image_url || 'https://placehold.co/500x500/f5e6e0/8b5e3c?text=Product',
        !!is_featured,
      ]
    );

    res.status(201).json({ id: result.insertId, slug, message: 'Product created' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A product with a similar name already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id — admin: edit an existing product
router.put('/:id', async (req, res) => {
  try {
    const { name, category_id, description, price, stock, image_url, is_featured } = req.body;

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const slug = name ? slugify(name) : existing[0].slug;

    await pool.query(
      `UPDATE products
       SET name = ?, slug = ?, category_id = ?, description = ?, price = ?, stock = ?, image_url = ?, is_featured = ?
       WHERE id = ?`,
      [
        name || existing[0].name,
        slug,
        category_id !== undefined ? category_id : existing[0].category_id,
        description !== undefined ? description : existing[0].description,
        price !== undefined ? price : existing[0].price,
        stock !== undefined ? stock : existing[0].stock,
        image_url || existing[0].image_url,
        is_featured !== undefined ? !!is_featured : existing[0].is_featured,
        req.params.id,
      ]
    );

    res.json({ message: 'Product updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id — admin: remove a product
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;