const router = require('express').Router();
const pool = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');

// GET all patients
router.get('/', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, w.ward_name FROM patients p
       LEFT JOIN wards w ON p.ward_id = w.ward_id
       ORDER BY p.patient_id DESC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single patient
router.get('/:id', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM patients WHERE patient_id=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Patient not found.' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST add patient
router.post('/', requireLogin, requireRole('admin', 'receptionist'), async (req, res) => {
  const { name, age, gender, phone, address, blood_group, admission_date, ward_id, status } = req.body;
  if (!name || !age || !gender || !phone || !admission_date)
    return res.status(400).json({ error: 'Name, age, gender, phone, and admission date are required.' });
  try {
    const [result] = await pool.query(
      `INSERT INTO patients (name, age, gender, phone, address, blood_group, admission_date, ward_id, status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [name, age, gender, phone, address || '', blood_group || '', admission_date, ward_id || null, status || 'Outpatient']
    );
    res.json({ message: 'Patient added successfully.', patient_id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update patient
router.put('/:id', requireLogin, requireRole('admin', 'receptionist'), async (req, res) => {
  const { name, age, gender, phone, address, blood_group, admission_date, discharge_date, ward_id, status } = req.body;
  try {
    await pool.query(
      `UPDATE patients SET name=?, age=?, gender=?, phone=?, address=?, blood_group=?,
       admission_date=?, discharge_date=?, ward_id=?, status=? WHERE patient_id=?`,
      [name, age, gender, phone, address || '', blood_group || '', admission_date,
       discharge_date || null, ward_id || null, status, req.params.id]
    );
    res.json({ message: 'Patient updated successfully.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE patient
router.delete('/:id', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM patients WHERE patient_id=?', [req.params.id]);
    res.json({ message: 'Patient deleted.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
