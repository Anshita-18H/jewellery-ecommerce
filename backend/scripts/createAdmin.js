/**
 * AURA — Fine Jewellery: Secure Admin Account Provisioning Script
 * 
 * Creates or elevates an account to role='admin' in MySQL.
 * 
 * Usage:
 *   node scripts/createAdmin.js [email] [password] [name]
 * 
 * Examples:
 *   # Upgrade existing account to admin (preserves existing password):
 *   node scripts/createAdmin.js anshitahedau@gmail.com
 * 
 *   # Create new admin or update existing with new password:
 *   node scripts/createAdmin.js admin@aura.com MySecurePassword123 "Store Admin"
 * 
 *   # Using environment variables:
 *   ADMIN_EMAIL=admin@aura.com ADMIN_PASSWORD=Secret node scripts/createAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Read from CLI arguments or environment variables
const args = process.argv.slice(2);
const targetEmail = (args[0] || process.env.ADMIN_EMAIL || 'anshitahedau@gmail.com').trim().toLowerCase();
const targetPassword = args[1] || process.env.ADMIN_PASSWORD || null;
const targetName = args[2] || process.env.ADMIN_NAME || 'AURA Administrator';

async function setupAdmin() {
  console.log('==================================================');
  console.log('AURA FINE JEWELLERY — SECURE ADMIN PROVISIONING');
  console.log('==================================================');

  if (!targetEmail) {
    console.error('❌ Error: Target email is required.');
    console.error('Usage: node scripts/createAdmin.js <email> [password] [name]');
    process.exit(1);
  }

  try {
    // 1. Inspect existing account with target email
    const [existing] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE email = ?',
      [targetEmail]
    );

    if (existing.length > 0) {
      const user = existing[0];
      console.log(`🔍 Account found for "${targetEmail}":`);
      console.log(`   User ID:      ${user.id}`);
      console.log(`   Name:         ${user.name}`);
      console.log(`   Current Role: ${user.role}`);

      // If user provides a new password, update hash; otherwise preserve current password
      if (targetPassword) {
        const passwordHash = bcrypt.hashSync(targetPassword, 10);
        await pool.query(
          'UPDATE users SET role = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['admin', passwordHash, user.id]
        );
        console.log('✅ Role elevated to "admin" and password updated successfully.');
      } else {
        await pool.query(
          'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['admin', user.id]
        );
        console.log('✅ Role elevated to "admin". Existing password preserved.');
      }

      console.log('--------------------------------------------------');
      console.log(`Account "${targetEmail}" is now authorized as an Administrator.`);
      process.exit(0);
    }

    // 2. Account does not exist — create new admin account
    const initialPassword = targetPassword || 'Admin@Aura2026!';
    const passwordHash = bcrypt.hashSync(initialPassword, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [targetName, targetEmail, passwordHash, 'admin']
    );

    console.log('✅ New Administrator account created successfully:');
    console.log(`   User ID:      ${result.insertId}`);
    console.log(`   Name:         ${targetName}`);
    console.log(`   Email:        ${targetEmail}`);
    console.log(`   Role:         admin`);
    if (!targetPassword) {
      console.log('   Password:     [INITIAL DEFAULT: Admin@Aura2026!]');
    } else {
      console.log('   Password:     [SECURELY HASHED & CONFIGURED]');
    }
    console.log('--------------------------------------------------');
    console.log(`You can now log in at #/admin/login with ${targetEmail}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Database error during admin setup:', err.message);
    process.exit(1);
  }
}

setupAdmin();

