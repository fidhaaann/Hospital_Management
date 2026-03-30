const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');

function randomToken(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function generateUniqueUsername(role) {
  const prefix = role === 'doctor' ? 'dr' : 'rcp';
  for (let i = 0; i < 20; i += 1) {
    const candidate = `${prefix}${randomToken(6).toLowerCase()}`;
    const [rows] = await pool.query('SELECT user_id FROM users WHERE username = ?', [candidate]);
    if (!rows.length) return candidate;
  }
  throw new Error('Failed to generate a unique username. Try again.');
}

router.get('/', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    const { q = '', role = 'all' } = req.query;
    const params = [];
    let sql = 'SELECT user_id, username, role, full_name, created_at FROM users WHERE 1=1';

    if (role !== 'all') {
      sql += ' AND role = ?';
      params.push(role);
    }

    if (q) {
      sql += ' AND (username LIKE ? OR full_name LIKE ? OR CAST(user_id AS CHAR) LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    sql += ' ORDER BY user_id';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireLogin, requireRole('admin'), async (req, res) => {
  const { role, full_name, phone, email, department } = req.body;
  let conn;
  let doctorProfileCreated = false;
  try {
    if (!full_name || !role) {
      return res.status(400).json({ error: 'Full name and role are required.' });
    }
    if (!['doctor', 'receptionist'].includes(role)) {
      return res.status(400).json({ error: 'Only doctor and receptionist accounts can be created.' });
    }

    const username = await generateUniqueUsername(role);
    const password = randomToken(10);
    const hashed = await bcrypt.hash(password, 10);

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO users (username, password, role, full_name) VALUES (?,?,?,?)',
      [username, hashed, role, full_name]
    );

    // Keep doctor accounts synced with doctors section
    if (role === 'doctor') {
      const docSpecialization = (department && String(department).trim()) || 'General Medicine';
      const docPhone = (phone && String(phone).trim()) || '9999999999';
      const docEmail = (email && String(email).trim()) || null;
      const consultationFee = 500;

      await conn.query(
        'INSERT INTO doctors (name, specialization, phone, email, consultation_fee, available) VALUES (?, ?, ?, ?, ?, ?)',
        [full_name, docSpecialization, docPhone, docEmail, consultationFee, true]
      );
      doctorProfileCreated = true;
    }

    await conn.commit();

    res.json({
      message: 'User created.',
      user_id: result.insertId,
      username,
      password,
      role,
      full_name,
      doctor_profile_created: doctorProfileCreated,
    });
  } catch (e) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    if (conn) conn.release();
  }
});

router.put('/:id', requireLogin, requireRole('admin'), async (req, res) => {
  const { full_name, role, phone, email, department } = req.body;
  try {
    const [rows] = await pool.query('SELECT user_id, role, full_name FROM users WHERE user_id=?', [req.params.id]);
    const existing = rows[0];
    if (!existing) return res.status(404).json({ error: 'User not found.' });
    if (existing.role === 'admin') return res.status(403).json({ error: 'Admin account cannot be edited here.' });

    if (!full_name || !role) {
      return res.status(400).json({ error: 'Full name and role are required.' });
    }
    if (!['doctor', 'receptionist'].includes(role)) {
      return res.status(400).json({ error: 'Only doctor and receptionist roles are allowed.' });
    }

    await pool.query('UPDATE users SET full_name=?, role=? WHERE user_id=?', [full_name, role, req.params.id]);

    // If role becomes doctor, ensure there is a matching doctor profile
    if (role === 'doctor') {
      const docSpecialization = (department && String(department).trim()) || 'General Medicine';
      const docPhone = (phone && String(phone).trim()) || '9999999999';
      const docEmail = (email && String(email).trim()) || null;
      const consultationFee = 500;

      const [existingDoctorByEmail] = docEmail
        ? await pool.query('SELECT doctor_id FROM doctors WHERE email = ? LIMIT 1', [docEmail])
        : [ [] ];
      const [existingDoctorByName] = await pool.query('SELECT doctor_id FROM doctors WHERE name = ? LIMIT 1', [existing.full_name]);
      const doctorRow = existingDoctorByEmail[0] || existingDoctorByName[0];

      if (!doctorRow) {
        await pool.query(
          'INSERT INTO doctors (name, specialization, phone, email, consultation_fee, available) VALUES (?, ?, ?, ?, ?, ?)',
          [full_name, docSpecialization, docPhone, docEmail, consultationFee, true]
        );
      } else {
        await pool.query(
          'UPDATE doctors SET name=?, specialization=?, phone=?, email=? WHERE doctor_id=?',
          [full_name, docSpecialization, docPhone, docEmail, doctorRow.doctor_id]
        );
      }
    }

    res.json({ message: 'User updated.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT user_id, role FROM users WHERE user_id=?', [req.params.id]);
    const existing = rows[0];
    if (!existing) return res.status(404).json({ error: 'User not found.' });
    if (existing.role === 'admin') return res.status(403).json({ error: 'Admin account cannot be deleted.' });

    await pool.query('DELETE FROM users WHERE user_id=?', [req.params.id]);
    res.json({ message: 'User deleted.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
