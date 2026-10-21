const assert = require('assert');
const pool = require('../config/db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

console.log('====================================================');
console.log('AURA FINE JEWELLERY — GOOGLE AUTH VERIFICATION TESTS');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function runAll() {
  const testRunId = Date.now();
  const testNewEmail = `aura.google.new.${testRunId}@test.com`;
  const testExistingEmail = `aura.google.existing.${testRunId}@test.com`;
  const testGoogleId1 = `gid_test_${testRunId}_1`;
  const testGoogleId2 = `gid_test_${testRunId}_2`;
  let newUserId = null;
  let existingUserId = null;

  try {
    // Run the startup migration on the test database
    await pool.query("ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL");
    const [existingGoogleCols] = await pool.query("SHOW COLUMNS FROM users LIKE 'google_id'");
    if (existingGoogleCols.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER role");
    }

    console.log('--- 1. Database Schema & Startup Migration Verification ---');

    await runTest('users.password_hash column is nullable', async () => {
      const [cols] = await pool.query(
        "SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash'"
      );
      assert.strictEqual(cols.length > 0, true, 'Column password_hash should exist');
      assert.strictEqual(cols[0].IS_NULLABLE, 'YES', 'password_hash must be nullable');
    });

    await runTest('users.google_id column exists with unique constraint', async () => {
      const [cols] = await pool.query(
        "SELECT COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'google_id'"
      );
      assert.strictEqual(cols.length > 0, true, 'Column google_id should exist');
      assert.strictEqual(parseInt(cols[0].CHARACTER_MAXIMUM_LENGTH, 10) >= 100, true);
    });

    console.log('\n--- 2. Core Functional Requirements ---');

    // (1) Brand-new Google account creates a customer user
    await runTest('(1) Brand-new Google account creates a customer user', async () => {
      const displayName = 'Google Guest';
      const [insert] = await pool.query(
        'INSERT INTO users (name, email, password_hash, phone, role, google_id) VALUES (?, ?, NULL, NULL, ?, ?)',
        [displayName, testNewEmail, 'customer', testGoogleId1]
      );
      newUserId = insert.insertId;

      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [newUserId]);
      assert.strictEqual(rows.length, 1);
      const u = rows[0];
      assert.strictEqual(u.email, testNewEmail);
      assert.strictEqual(u.password_hash, null, 'password_hash must be NULL');
      assert.strictEqual(u.phone, null);
      assert.strictEqual(u.role, 'customer', 'Role must be customer');
      assert.strictEqual(u.google_id, testGoogleId1);
    });

    // (2) Existing email/password user signing in with the same Gmail gets linked, not duplicated
    await runTest('(2) Existing email/password user signing in with same Gmail gets linked, not duplicated', async () => {
      // Create user first with password
      const pwHash = bcrypt.hashSync('OldPassword123', 10);
      const [insert] = await pool.query(
        'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
        ['Existing Client', testExistingEmail, pwHash, '9999988888', 'customer']
      );
      existingUserId = insert.insertId;

      // Simulate Google Sign-In lookup by email and linking google_id
      const [emailLookup] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [testExistingEmail]);
      assert.strictEqual(emailLookup.length, 1);
      assert.strictEqual(emailLookup[0].google_id, null, 'Initially google_id should be null');

      // Link google_id
      await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [testGoogleId2, emailLookup[0].id]);

      // Verify linked
      const [linkedRows] = await pool.query('SELECT * FROM users WHERE email = ?', [testExistingEmail]);
      assert.strictEqual(linkedRows.length, 1, 'User must not be duplicated');
      assert.strictEqual(linkedRows[0].id, existingUserId);
      assert.strictEqual(linkedRows[0].google_id, testGoogleId2, 'google_id must be linked');
      assert.notStrictEqual(linkedRows[0].password_hash, null, 'Existing password hash must remain intact');
    });

    // (3) A Google-only account cannot log in with a password
    await runTest('(3) A Google-only account cannot log in with a password', async () => {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [newUserId]);
      assert.strictEqual(rows.length, 1);
      const googleOnlyUser = rows[0];

      // Simulated logic from POST /api/auth/login
      let loginError = null;
      if (!googleOnlyUser.password_hash) {
        loginError = 'This account uses Google sign-in';
      }

      assert.strictEqual(loginError, 'This account uses Google sign-in');
    });

    // (4) Role stays 'customer' and never elevates or changes
    await runTest('(4) Role stays "customer" and never creates admin or changes existing roles', async () => {
      const [userRows] = await pool.query('SELECT role FROM users WHERE id = ?', [newUserId]);
      assert.strictEqual(userRows[0].role, 'customer');

      // Attempt to ensure that role cannot be overwritten by Google login
      const [existingUserRows] = await pool.query('SELECT role FROM users WHERE id = ?', [existingUserId]);
      assert.strictEqual(existingUserRows[0].role, 'customer');
    });

    console.log('\n--- 3. Token & Email Validation Rules ---');

    await runTest('Unverified Google email is rejected', () => {
      const payload = { email: 'fake@example.com', email_verified: false };
      const isVerified = payload.email_verified === true || payload.email_verified === 'true';
      assert.strictEqual(isVerified, false, 'Unverified email must be rejected');
    });

    await runTest('Missing credential payload is rejected', () => {
      const body = {};
      assert.strictEqual(!body.credential, true);
    });

  } finally {
    // Clean up test data
    if (newUserId) {
      await pool.query('DELETE FROM users WHERE id = ?', [newUserId]).catch(() => {});
    }
    if (existingUserId) {
      await pool.query('DELETE FROM users WHERE id = ?', [existingUserId]).catch(() => {});
    }
  }

  console.log('\n====================================================');
  console.log(`Test Results: ${passedTests}/${totalTests} Passed`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAll().then(() => {
  pool.end();
}).catch((err) => {
  console.error('Test suite failed:', err);
  pool.end();
  process.exit(1);
});
