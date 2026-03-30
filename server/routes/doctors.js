const router = require('express').Router();
const pool = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');

router.get('/', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM doctors ORDER BY doctor_id DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM doctors WHERE doctor_id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Doctor not found.' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/fee', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT consultation_fee FROM doctors WHERE doctor_id=?', [req.params.id]);
    res.json(rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireLogin, requireRole('admin'), async (req, res) => {
  const { name, specialization, phone, email, consultation_fee } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO doctors (name, specialization, phone, email, consultation_fee) VALUES (?,?,?,?,?)',
      [name, specialization, phone, email || '', consultation_fee]
    );
    res.json({ message: 'Doctor added.', doctor_id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireLogin, requireRole('admin'), async (req, res) => {
  const { name, specialization, phone, email, consultation_fee, available } = req.body;
  try {
    await pool.query(
      'UPDATE doctors SET name=?, specialization=?, phone=?, email=?, consultation_fee=?, available=? WHERE doctor_id=?',
      [name, specialization, phone, email || '', consultation_fee, available ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Doctor updated.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM doctors WHERE doctor_id=?', [req.params.id]);
    res.json({ message: 'Doctor deleted.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
