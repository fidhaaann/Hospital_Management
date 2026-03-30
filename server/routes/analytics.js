const router = require('express').Router();
const pool = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');

router.get('/', requireLogin, requireRole('admin'), async (req, res) => {
  try {
    const [[revenue]]         = await pool.query('SELECT * FROM revenue_summary');
    const [monthly]           = await pool.query(
      `SELECT MONTH(admission_date) AS month, MONTHNAME(admission_date) AS month_name, COUNT(*) AS count
       FROM patients WHERE YEAR(admission_date)=YEAR(CURDATE())
       GROUP BY MONTH(admission_date), MONTHNAME(admission_date) ORDER BY month`
    );
    const [topDoctors]        = await pool.query(
      `SELECT d.doctor_id, d.name, d.specialization, COUNT(a.appointment_id) AS total
       FROM doctors d LEFT JOIN appointments a ON d.doctor_id=a.doctor_id
       GROUP BY d.doctor_id, d.name, d.specialization ORDER BY total DESC LIMIT 5`
    );
    const [statusBreakdown]   = await pool.query('SELECT status, COUNT(*) AS count FROM patients GROUP BY status');
    const [wardOcc]           = await pool.query('SELECT * FROM ward_occupancy');
    const [paymentBreakdown]  = await pool.query(
      'SELECT payment_status, COUNT(*) AS count, SUM(total_amount) AS total FROM bills GROUP BY payment_status'
    );
    res.json({ revenue: revenue || {}, monthly, top_doctors: topDoctors, status_breakdown: statusBreakdown, ward_occ: wardOcc, payment_breakdown: paymentBreakdown });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
