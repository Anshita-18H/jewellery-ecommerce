const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const { searchProducts } = require('../utils/searchEngine');

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
    const { category, search, featured, gallery, occasion, gender, min_price, max_price, include_hidden } = req.query;

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

    // By default, public storefront only sees active products. Admin panel passes include_hidden=true
    if (include_hidden !== 'true') {
      sql += ' AND COALESCE(p.is_active, 1) = 1';
    }

    if (category) {
      sql += ' AND c.slug = ?';
      params.push(category);
    }
    if (occasion) {
      sql += " AND (CONCAT(',', REPLACE(COALESCE(p.occasion_tags, ''), ' ', ''), ',') LIKE ?)";
      params.push(`%,${occasion.trim()},%`);
    }
    if (gender) {
      sql += ' AND p.gender_tag = ?';
      params.push(gender.toLowerCase().trim());
    }
    if (min_price !== undefined && min_price !== '') {
      const minNum = Number(min_price);
      if (!isNaN(minNum)) {
        sql += ' AND p.price >= ?';
        params.push(minNum);
      }
    }
    if (max_price !== undefined && max_price !== '') {
      const maxNum = Number(max_price);
      if (!isNaN(maxNum)) {
        sql += ' AND p.price <= ?';
        params.push(maxNum);
      }
    }
    if (featured === 'true') {
      sql += ' AND p.is_featured = TRUE';
    }
    if (gallery === 'true') {
      sql += ' AND p.is_in_gallery = TRUE';
    }

    sql += ' GROUP BY p.id ORDER BY p.created_at DESC';

    const [rows] = await pool.query(sql, params);
    const finalResults = search ? searchProducts(rows, search) : rows;
    res.json(finalResults);
  } catch (err) {
    console.error('Products fetch error, attempting fallback query:', err.message);
    try {
      const { category, search, featured, gallery, occasion, gender, min_price, max_price, include_hidden } = req.query;
      let fallbackSql = `
        SELECT p.*, c.name AS category_name, c.slug AS category_slug,
               0 AS avg_rating,
               0 AS rating_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1 = 1
      `;
      const fallbackParams = [];

      if (include_hidden !== 'true') {
        fallbackSql += ' AND COALESCE(p.is_active, 1) = 1';
      }

      if (category) {
        fallbackSql += ' AND c.slug = ?';
        fallbackParams.push(category);
      }
      if (occasion) {
        fallbackSql += " AND (CONCAT(',', REPLACE(COALESCE(p.occasion_tags, ''), ' ', ''), ',') LIKE ?)";
        fallbackParams.push(`%,${occasion.trim()},%`);
      }
      if (gender) {
        fallbackSql += ' AND p.gender_tag = ?';
        fallbackParams.push(gender.toLowerCase().trim());
      }
      if (min_price !== undefined && min_price !== '') {
        const minNum = Number(min_price);
        if (!isNaN(minNum)) {
          fallbackSql += ' AND p.price >= ?';
          fallbackParams.push(minNum);
        }
      }
      if (max_price !== undefined && max_price !== '') {
        const maxNum = Number(max_price);
        if (!isNaN(maxNum)) {
          fallbackSql += ' AND p.price <= ?';
          fallbackParams.push(maxNum);
        }
      }
      if (featured === 'true') {
        fallbackSql += ' AND p.is_featured = TRUE';
      }
      if (gallery === 'true') {
        fallbackSql += ' AND p.is_in_gallery = TRUE';
      }

      fallbackSql += ' ORDER BY p.created_at DESC';

      const [fallbackRows] = await pool.query(fallbackSql, fallbackParams);
      const finalFallbackResults = search ? searchProducts(fallbackRows, search) : fallbackRows;
      return res.json(finalFallbackResults);
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
// Body: { name, category_id, description, price, stock, image_url, is_featured, is_hero_banner, is_in_gallery, is_active, section_cover, occasion_tags, gender_tag }
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      category_id,
      description,
      price,
      stock,
      image_url,
      is_featured,
      is_hero_banner,
      is_in_gallery,
      is_active,
      section_cover,
      occasion_tags,
      gender_tag,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'name and price are required' });
    }

    const slug = await getUniqueSlug(slugify(name));

    // If marked as section cover, clear any previous product for this section
    const cleanSectionCover = section_cover ? String(section_cover).trim().toLowerCase() : null;
    if (cleanSectionCover) {
      await pool.query('UPDATE products SET section_cover = NULL WHERE section_cover = ?', [cleanSectionCover]);
    }

    const activeFlag = is_active !== undefined ? (is_active ? 1 : 0) : 1;

    const [result] = await pool.query(
      `INSERT INTO products (category_id, name, slug, description, price, stock, image_url, is_featured, is_hero_banner, is_in_gallery, is_active, section_cover, occasion_tags, gender_tag)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id || null,
        name,
        slug,
        description || '',
        price,
        stock || 0,
        image_url || 'https://placehold.co/500x500/f5e6e0/8b5e3c?text=Product',
        !!is_featured,
        !!is_hero_banner,
        !!is_in_gallery,
        activeFlag,
        cleanSectionCover || null,
        occasion_tags || null,
        gender_tag || null,
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
    const {
      name,
      category_id,
      description,
      price,
      stock,
      image_url,
      is_featured,
      is_hero_banner,
      is_in_gallery,
      is_active,
      section_cover,
      occasion_tags,
      gender_tag,
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const slug = name ? await getUniqueSlug(slugify(name), req.params.id) : existing[0].slug;

    // If marked as section cover, clear other products for that section
    const cleanSectionCover = section_cover !== undefined
      ? (section_cover ? String(section_cover).trim().toLowerCase() : null)
      : existing[0].section_cover;

    if (cleanSectionCover) {
      await pool.query('UPDATE products SET section_cover = NULL WHERE section_cover = ? AND id != ?', [cleanSectionCover, req.params.id]);
    }

    const activeFlag = is_active !== undefined ? (is_active ? 1 : 0) : existing[0].is_active;

    await pool.query(
      `UPDATE products
       SET name = ?, slug = ?, category_id = ?, description = ?, price = ?, stock = ?, image_url = ?, is_featured = ?, is_hero_banner = ?, is_in_gallery = ?, is_active = ?, section_cover = ?, occasion_tags = ?, gender_tag = ?
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
        is_hero_banner !== undefined ? !!is_hero_banner : existing[0].is_hero_banner,
        is_in_gallery !== undefined ? !!is_in_gallery : existing[0].is_in_gallery,
        activeFlag,
        cleanSectionCover,
        occasion_tags !== undefined ? occasion_tags : existing[0].occasion_tags,
        gender_tag !== undefined ? gender_tag : existing[0].gender_tag,
        req.params.id,
      ]
    );

    res.json({ message: 'Product updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// PUT /api/products/:id/status — admin: activate or deactivate product (soft toggle)
router.put('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { is_active } = req.body;
    let newStatus;
    if (is_active !== undefined) {
      newStatus = is_active ? 1 : 0;
    } else {
      const [existing] = await pool.query('SELECT is_active FROM products WHERE id = ?', [req.params.id]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      newStatus = existing[0].is_active === 1 ? 0 : 1;
    }

    await pool.query('UPDATE products SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({
      message: newStatus === 1 ? 'Product activated successfully' : 'Product deactivated successfully',
      is_active: newStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product status' });
  }
});

// PUT /api/products/:id/restore — admin: activate a deactivated product
router.put('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('UPDATE products SET is_active = 1 WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product activated successfully', is_active: 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to activate product' });
  }
});

// DELETE /api/products/:id — admin: soft-delete (deactivate) a product to keep database records intact
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deactivated (soft-deleted) successfully', is_active: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate product' });
  }
});

// DELETE /api/products/:id/permanent — admin: permanently remove a product from DB if specifically needed
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