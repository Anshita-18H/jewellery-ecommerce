const pool = require('../config/db');

async function migrate() {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM products LIKE 'is_in_gallery'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN is_in_gallery TINYINT(1) DEFAULT 0");
      console.log('Successfully added is_in_gallery column to products table.');
    } else {
      console.log('is_in_gallery column already exists.');
    }

    // By default, if no products are in gallery yet, mark the current featured or top 6 products as gallery
    const [galleryCount] = await pool.query("SELECT COUNT(*) AS cnt FROM products WHERE is_in_gallery = 1");
    if (galleryCount[0].cnt === 0) {
      console.log('No gallery items set yet. Setting initial gallery items from top active products...');
      await pool.query("UPDATE products SET is_in_gallery = 1 LIMIT 6");
      console.log('Initial 6 gallery products set.');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
