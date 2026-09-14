const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Cryptographically secure password hashing with bcryptjs
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, stored) {
  if (!stored) return false;

  // Check if stored is a bcrypt hash
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    try {
      return bcrypt.compareSync(password, stored);
    } catch (err) {
      return false;
    }
  }

  // Fallback: legacy scrypt salt:hash format
  try {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const check = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(check, 'hex'), Buffer.from(hash, 'hex'));
  } catch (err) {
    return false;
  }
}

// POST /api/auth/register — create customer account (strictly customer role)
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    const passwordHash = hashPassword(password);
    // Customers can NEVER register with admin role
    const role = 'customer';

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, passwordHash, (phone || '').trim() || null, role]
    );

    const userId = result.insertId;

    // Attach to server-side session
    req.session.userId = userId;
    req.session.role = 'customer';
    req.session.userRole = 'customer';

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
      res.status(201).json({
        user: {
          id: userId,
          name: name.trim(),
          email: cleanEmail,
          phone: (phone || '').trim() || null,
          role: 'customer',
        },
        message: 'Account created successfully',
      });
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: "We couldn't create your account right now. Please try again." });
  }
});

// POST /api/auth/login — authenticate customer
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const valid = verifyPassword(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Bind authenticated user to server-side session
    req.session.userId = user.id;
    req.session.role = user.role || 'customer';
    req.session.userRole = user.role || 'customer';

    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        message: 'Signed in successfully',
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Unable to sign in. Please verify your credentials.' });
  }
});

// GET /api/auth/me — retrieve current customer session user
router.get('/me', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.json({ user: null });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (rows.length === 0) {
      // Stale session
      req.session.userId = null;
      req.session.role = null;
      req.session.userRole = null;
      return res.json({ user: null });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: 'Failed to verify session' });
  }
});

// POST /api/auth/logout — destroy session
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

/* ========================================================
   ADMINISTRATOR AUTHENTICATION (SESSION + HttpOnly COOKIES)
   ======================================================== */

// POST /api/auth/admin/login — authenticate administrator
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid administrator credentials' });
    }

    const user = rows[0];
    const valid = verifyPassword(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid administrator credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    // Bind administrator to server-side session
    req.session.userId = user.id;
    req.session.role = 'admin';
    req.session.userRole = 'admin';

    req.session.save((err) => {
      if (err) {
        console.error('Admin session save error:', err);
      }
      res.json({
        admin: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'admin',
        },
        message: 'Administrator authenticated successfully',
      });
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Unable to authenticate administrator. Please try again.' });
  }
});

// GET /api/auth/admin/me — verify active administrator session
router.get('/admin/me', async (req, res) => {
  try {
    const userRole = req.session?.role || req.session?.userRole;
    if (!req.session || !req.session.userId || userRole !== 'admin') {
      return res.status(401).json({ error: 'Administrator session not found' });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role FROM users WHERE id = ? AND role = ?',
      [req.session.userId, 'admin']
    );

    if (rows.length === 0) {
      req.session.userId = null;
      req.session.role = null;
      req.session.userRole = null;
      return res.status(401).json({ error: 'Administrator session invalid or expired' });
    }

    res.json({ admin: rows[0] });
  } catch (err) {
    console.error('Admin auth check error:', err);
    res.status(500).json({ error: 'Failed to verify administrator session' });
  }
});

// POST /api/auth/admin/logout — destroy administrator session
router.post('/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Admin logout error:', err);
      return res.status(500).json({ error: 'Failed to terminate administrator session' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Administrator logged out successfully' });
  });
});

module.exports = router;
