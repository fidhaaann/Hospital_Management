const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to ensure user is logged in
const authMiddleware = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// GET /api/notifications - Get all notifications for the logged in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user_id = req.session.userId;
    const role = req.session.role;
    const [rows] = await db.execute(
      `SELECT n.*, u.full_name as sender_name, u.role as sender_role
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.user_id
       WHERE n.recipient_role = ? OR n.recipient_id = ? OR n.recipient_role = 'all'
       ORDER BY n.created_at DESC LIMIT 50`,
      [role, user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
});

// GET /api/notifications/doctors-list - Get minimal list of doctors for the dropdown
router.get('/doctors-list', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT user_id, full_name FROM users WHERE role = 'doctor' ORDER BY full_name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch doctors error:', err);
    res.status(500).json({ error: 'Server error fetching doctors' });
  }
});

// POST /api/notifications - Create a new notification (message/note)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message, recipient_role = 'doctor', recipient_id = null, type = 'message' } = req.body;
    const sender_id = req.session.userId;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    await db.execute(
      `INSERT INTO notifications (sender_id, recipient_role, recipient_id, message, type)
       VALUES (?, ?, ?, ?, ?)`,
      [sender_id, recipient_role, recipient_id, message, type]
    );
    res.json({ message: 'Notification sent successfully' });
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ error: 'Server error sending notification' });
  }
});

// PUT /api/notifications/read - Mark notifications as read
router.put('/read', authMiddleware, async (req, res) => {
  try {
    const user_id = req.session.userId;
    const role = req.session.role;
    await db.execute(
      `UPDATE notifications SET is_read = TRUE 
       WHERE (recipient_role = ? OR recipient_id = ? OR recipient_role = 'all') AND is_read = FALSE`,
      [role, user_id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Server error updating notifications' });
  }
});

module.exports = router;
