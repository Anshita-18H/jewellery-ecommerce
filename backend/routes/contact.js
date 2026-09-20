const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact — submit customer contact inquiry
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const trimmedName = name.trim().slice(0, 150);
    const trimmedEmail = email.trim().toLowerCase().slice(0, 150);
    const trimmedMessage = message.trim().slice(0, 5000);

    const [result] = await pool.query(
      `INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)`,
      [trimmedName, trimmedEmail, trimmedMessage]
    );

    res.status(201).json({
      message: 'Your message has been received. Our concierge will get back to you shortly.',
      id: result.insertId,
    });
  } catch (err) {
    console.error('Error saving contact message:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

// GET /api/contact — admin list of messages (newest first)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, message, created_at FROM contact_messages ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching contact messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
