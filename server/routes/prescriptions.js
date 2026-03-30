const router = require('express').Router();
const pool = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');

router.get('/', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pr.*, p.name AS patient_name, d.name AS doctor_name
       FROM prescriptions pr
       JOIN patients p ON pr.patient_id = p.patient_id
       JOIN doctors d ON pr.doctor_id = d.doctor_id
       ORDER BY pr.created_at DESC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireLogin, requireRole('admin', 'doctor'), async (req, res) => {
  const { patient_id, doctor_id, diagnosis, notes } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO prescriptions (patient_id, doctor_id, diagnosis, notes) VALUES (?,?,?,?)',
      [patient_id, doctor_id, diagnosis, notes || '']
    );
    res.json({ message: 'Prescription added.', prescription_id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
