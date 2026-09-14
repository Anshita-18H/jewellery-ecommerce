/**
 * Database Seed Script: Admin Account Initialization
 * Safe, idempotent seed script to create or verify the master administrator account.
 * 
 * Usage: node scripts/seed-admin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const ADMIN_NAME = process.env.ADMIN_INITIAL_NAME || 'AURA Master Administrator';
const ADMIN_EMAIL = (process.env.ADMIN_INITIAL_EMAIL || 'admin@aura.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@Aura2026!';

async function seedAdmin() {
  console.log('--- AURA Master Admin Seed ---');
  try {
    // 1. Check if an admin account with this email already exists
    const [existing] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      [ADMIN_EMAIL]
    );

    if (existing.length > 0) {
      const user = existing[0];
      if (user.role !== 'admin') {
        console.log(`Account ${ADMIN_EMAIL} exists with role "${user.role}". Elevating to "admin"...`);
        await pool.query('UPDATE users SET role = ? WHERE id = ?', ['admin', user.id]);
        console.log(`✅ Successfully updated role to "admin" for user ID ${user.id}.`);
      } else {
        console.log(`✅ Admin account "${ADMIN_EMAIL}" already exists (User ID: ${user.id}, Role: "admin"). No duplicate created.`);
      }
      process.exit(0);
    }

    // 2. Hash the initial password with bcryptjs
    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, saltRounds);

    // 3. Insert the new admin record
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [ADMIN_NAME, ADMIN_EMAIL, passwordHash, '+91 98765 43210', 'admin']
    );

    console.log('✅ Master Administrator created successfully!');
    console.log(`   ID:       ${result.insertId}`);
    console.log(`   Name:     ${ADMIN_NAME}`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Role:     admin`);
    console.log(`   Password: [SET TO DEFAULT / CONFIGURED ENV]`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed admin account:', err);
    process.exit(1);
  }
}

seedAdmin();

