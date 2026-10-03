const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { sendPasswordResetEmail } = require('../services/email');

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

// POST /api/auth/signup & /api/auth/register — create customer account (strictly customer role)
async function handleSignup(req, res) {
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
    console.error('Registration/Signup error:', err);
    res.status(500).json({ error: "We couldn't create your account right now. Please try again." });
  }
}

router.post('/signup', handleSignup);
router.post('/register', handleSignup);

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
   PASSWORD RESET (FORGOT & RESET PASSWORD)
   ======================================================== */

// Simple in-memory rate limiter for password reset requests (5 requests per 15 minutes)
const forgotPasswordRateLimits = new Map();

function checkPasswordResetRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const attempts = (forgotPasswordRateLimits.get(key) || []).filter((t) => now - t < windowMs);

  if (attempts.length >= maxAttempts) {
    return true;
  }

  attempts.push(now);
  forgotPasswordRateLimits.set(key, attempts);
  return false;
}

// POST /api/auth/forgot-password — initiate password reset flow
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Rate limit by IP or email
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const rateLimitKey = `${clientIp}:${cleanEmail}`;

    if (checkPasswordResetRateLimit(rateLimitKey)) {
      return res.status(429).json({
        error: 'Too many password reset requests. For security reasons, please try again in 15 minutes.',
      });
    }

    // Generic response message to avoid account enumeration
    const genericResponse = {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };

    // Check if user exists in database
    const [users] = await pool.query('SELECT id, name, email FROM users WHERE email = ?', [cleanEmail]);

    if (users.length === 0) {
      // Return identical generic response to prevent email enumeration
      return res.json(genericResponse);
    }

    const user = users[0];

    // Invalidate any previously active unused tokens for this user
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
      [user.id]
    );

    // Generate cryptographically secure random token (32 bytes = 64 hex characters)
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Hash the token with SHA-256 for database storage
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Token expires in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );

    // Determine the base frontend URL for the reset link
    let frontendBase = (process.env.FRONTEND_URL || 'https://anshita-18h.github.io/jewellery-ecommerce').trim().replace(/\/+$/, '');

    // In local development, dynamically match caller origin if on localhost
    const clientOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);
    if (process.env.NODE_ENV !== 'production' && clientOrigin && clientOrigin.includes('localhost')) {
      frontendBase = clientOrigin.replace(/\/+$/, '');
    }

    // AURA frontend uses HashRouter for GitHub Pages compatibility
    const resetUrl = `${frontendBase}/#/reset-password?token=${rawToken}`;

    // Dispatch email
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      expiresInMinutes: 30,
    });

    // In development mode, optionally provide the resetUrl in the response for test automation
    if (process.env.NODE_ENV !== 'production') {
      return res.json({
        ...genericResponse,
        _devResetUrl: resetUrl,
      });
    }

    return res.json(genericResponse);
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request. Please try again later.' });
  }
});

// GET /api/auth/verify-reset-token — verify validity of token before rendering reset form
router.get('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ valid: false, error: 'Reset token is required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const [rows] = await pool.query(
      'SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ?',
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(400).json({ valid: false, error: 'This password reset link is invalid.' });
    }

    const tokenRecord = rows[0];

    if (tokenRecord.used_at !== null) {
      return res.status(400).json({
        valid: false,
        error: 'This password reset link has already been used. Please request a new one.',
      });
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(400).json({
        valid: false,
        error: 'This password reset link has expired. Please request a new one.',
      });
    }

    res.json({ valid: true });
  } catch (err) {
    console.error('Verify reset token error:', err);
    res.status(500).json({ valid: false, error: 'Failed to verify reset token' });
  }
});

// POST /api/auth/reset-password — update user password using secure token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ error: 'Reset token is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const [rows] = await pool.query(
      'SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ?',
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        error: 'This password reset link is invalid or has expired. Please request a new one.',
      });
    }

    const tokenRecord = rows[0];

    if (tokenRecord.used_at !== null) {
      return res.status(400).json({
        error: 'This password reset link has already been used. Please request a new one.',
      });
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(400).json({
        error: 'This password reset link has expired. Please request a new one.',
      });
    }

    // Hash the new password with bcrypt
    const newPasswordHash = hashPassword(password);

    // Update user password
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [
      newPasswordHash,
      tokenRecord.user_id,
    ]);

    // Mark current token as used
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [
      tokenRecord.id,
    ]);

    // Invalidate any other active reset tokens for this user
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
      [tokenRecord.user_id]
    );

    // If caller has an active session for this user, terminate it to ensure fresh login
    if (req.session && req.session.userId === tokenRecord.user_id) {
      req.session.userId = null;
      req.session.role = null;
      req.session.userRole = null;
    }

    res.json({
      message: 'Your password has been reset successfully. You can now sign in with your new password.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Unable to reset password. Please try again later.' });
  }
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
