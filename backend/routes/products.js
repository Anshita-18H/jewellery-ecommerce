const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

// Helper: turn a product name into a URL-friendly slug
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/products
// Supports optional query params: ?category=rings&search=gold&featured=true&include_hidden=true
// By default, only shows active (visible) products. Admin panel passes
// include_hidden=true to see everything, including soft-deleted products.
router.get('/', async (req, res) => {
  try {
    const { category, search, featured } = req.query;

    let sql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
             COALESCE(ROUND(AVG(pr.rating), 1), 0) AS avg_rating,
             COUNT(pr.id) AS rating_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_ratings pr ON p.id = pr.product_id
      WHERE 1 = 1
    `;
    const params = [];

    if (category) {
      sql += ' AND c.slug = ?';
      params.push(category);
    }
    if (search) {
      const searchNum = Number(search);
      if (Number.isInteger(searchNum) && searchNum > 0) {
        sql += ' AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR p.id = ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, searchNum);
      } else {
        sql += ' AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
    }
    if (featured === 'true') {
      sql += ' AND p.is_featured = TRUE';
    }

    sql += ' GROUP BY p.id ORDER BY p.created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Products fetch error, attempting fallback query:', err.message);
    try {
      let fallbackSql = `
        SELECT p.*, c.name AS category_name, c.slug AS category_slug,
               0 AS avg_rating,
               0 AS rating_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1 = 1
      `;
      const fallbackParams = [];

      if (category) {
        fallbackSql += ' AND c.slug = ?';
        fallbackParams.push(category);
      }
      if (search) {
        const searchNum = Number(search);
        if (Number.isInteger(searchNum) && searchNum > 0) {
          fallbackSql += ' AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR p.id = ?)';
          fallbackParams.push(`%${search}%`, `%${search}%`, `%${search}%`, searchNum);
        } else {
          fallbackSql += ' AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)';
          fallbackParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
      }
      if (featured === 'true') {
        fallbackSql += ' AND p.is_featured = TRUE';
      }

      fallbackSql += ' ORDER BY p.created_at DESC';

      const [fallbackRows] = await pool.query(fallbackSql, fallbackParams);
      return res.json(fallbackRows);
    } catch (fallbackErr) {
      console.error('Fallback query error:', fallbackErr.message);
    }
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Helper: ensure slug is unique across products
async function getUniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    let sql = 'SELECT id FROM products WHERE slug = ?';
    const params = [slug];
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    const [existing] = await pool.query(sql, params);
    if (existing.length === 0) return slug;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

// GET /api/products/:slug — single product detail page
router.get('/:slug', async (req, res) => {
  try {
    let sql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
             COALESCE(ROUND(AVG(pr.rating), 1), 0) AS avg_rating,
             COUNT(pr.id) AS rating_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_ratings pr ON p.id = pr.product_id
      WHERE p.slug = ?
      GROUP BY p.id
    `;

    const [rows] = await pool.query(sql, [req.params.slug]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Product detail fetch error, attempting fallback query:', err.message);
    try {
      let fallbackSql = `
        SELECT p.*, c.name AS category_name, c.slug AS category_slug,
               0 AS avg_rating,
               0 AS rating_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.slug = ?
      `;
      const [fallbackRows] = await pool.query(fallbackSql, [req.params.slug]);
      if (fallbackRows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.json(fallbackRows[0]);
    } catch (fallbackErr) {
      console.error('Fallback query error:', fallbackErr.message);
    }
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products — admin: add a new product
// Body: { name, category_id, description, price, stock, image_url, is_featured }
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, category_id, description, price, stock, image_url, is_featured } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'name and price are required' });
    }

    const slug = await getUniqueSlug(slugify(name));

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
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, category_id, description, price, stock, image_url, is_featured } = req.body;

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const slug = name ? await getUniqueSlug(slugify(name), req.params.id) : existing[0].slug;

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
router.delete('/:id', requireAdmin, async (req, res) => {
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

// DELETE /api/products/:id/permanent — admin: permanently remove a product from DB
router.delete('/:id/permanent', requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product permanently deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to permanently delete product' });
  }
});

module.exports = router;