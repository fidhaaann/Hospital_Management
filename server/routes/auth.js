const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');

// POST /api/auth/register — create a new user account
router.post('/register', async (req, res) => {
  return res.status(403).json({ error: 'Self registration is disabled. Contact admin.' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Incorrect username or password.' });

    // Support both plain-text seed passwords and bcrypt hashed passwords
    let ok = false;
    if (user.password.startsWith('$2')) {
      ok = await bcrypt.compare(password, user.password);
    } else {
      ok = password === user.password;
    }
    if (!ok) return res.status(401).json({ error: 'Incorrect username or password.' });

    // Validate that the selected role matches the user's actual role
    const selectedRole = role || 'receptionist';
    if (user.role !== selectedRole) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    req.session.userId   = user.user_id;
    req.session.username = user.username;
    req.session.role     = user.role;
    req.session.fullName = user.full_name;

    res.json({
      user_id:   user.user_id,
      username:  user.username,
      role:      user.role,
      full_name: user.full_name,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out.' }));
});

// GET /api/auth/me  — used by frontend on page refresh to restore session
router.get('/me', (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: 'Not authenticated.' });
  res.json({
    user_id:   req.session.userId,
    username:  req.session.username,
    role:      req.session.role,
    full_name: req.session.fullName,
  });
});

module.exports = router;
