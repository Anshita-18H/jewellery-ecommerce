const pool = require('../config/db');

async function migrate() {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM products LIKE 'is_active'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER is_in_gallery");
      console.log('Successfully added is_active column to products table.');
    } else {
      console.log('is_active column already exists.');
    }

    await pool.query("UPDATE products SET is_active = 1 WHERE is_active IS NULL");
    console.log('Updated existing products to is_active = 1.');

    const [rows] = await pool.query("SELECT id, name, is_active FROM products");
    console.log('Total products:', rows.length, 'Active products:', rows.filter(r => r.is_active === 1).length);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
