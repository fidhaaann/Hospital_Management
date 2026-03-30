const router = require('express').Router();
const pool = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');

router.get('/', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ward_occupancy ORDER BY ward_id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireLogin, requireRole('admin'), async (req, res) => {
  const { ward_name, ward_type, total_beds, charge_per_day } = req.body;

  if (!ward_name || !ward_type || !total_beds || charge_per_day === undefined) {
    return res.status(400).json({ error: 'Ward name, type, total beds, and charge per day are required.' });
  }

  const beds = Number(total_beds);
  const charge = Number(charge_per_day);
  if (!Number.isFinite(beds) || beds <= 0) {
    return res.status(400).json({ error: 'Total beds must be greater than 0.' });
  }
  if (!Number.isFinite(charge) || charge < 0) {
    return res.status(400).json({ error: 'Charge per day must be 0 or more.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO wards (ward_name, ward_type, total_beds, available_beds, charge_per_day) VALUES (?, ?, ?, ?, ?)',
      [ward_name, ward_type, beds, beds, charge]
    );
    res.json({ message: 'Ward created.', ward_id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
