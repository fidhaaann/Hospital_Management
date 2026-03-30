const router = require('express').Router();
const pool = require('../db');
const { requireLogin } = require('../middleware/auth');

router.get('/', requireLogin, async (req, res) => {
  try {
    const [[totalPatients]]    = await pool.query('SELECT COUNT(*) AS c FROM patients');
    const [[admittedPatients]] = await pool.query("SELECT COUNT(*) AS c FROM patients WHERE status='Admitted'");
    const [[totalDoctors]]     = await pool.query('SELECT COUNT(*) AS c FROM doctors');
    const [[totalAppts]]       = await pool.query('SELECT COUNT(*) AS c FROM appointments');
    const [[todayAppts]]       = await pool.query('SELECT COUNT(*) AS c FROM appointments WHERE appointment_date=CURDATE()');

    const [patientsWithDoctors] = await pool.query(
      `SELECT p.patient_id, p.name AS patient_name, p.age, p.gender,
              p.status, p.admission_date,
              d.name AS doctor_name, d.specialization
       FROM patients p
       LEFT JOIN appointments a ON p.patient_id = a.patient_id
       LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
       GROUP BY p.patient_id, p.name, p.age, p.gender, p.status, p.admission_date, d.name, d.specialization
       ORDER BY p.patient_id DESC
       LIMIT 10`
    );

    const [[revenue]]      = await pool.query('SELECT * FROM revenue_summary');
    const [lowStock]       = await pool.query('SELECT * FROM low_stock_medicines');
    const [wardOccupancy]  = await pool.query('SELECT * FROM ward_occupancy');
    const [monthlyPatients] = await pool.query(
      `SELECT MONTH(admission_date) AS month, MONTHNAME(admission_date) AS month_name, COUNT(*) AS count
       FROM patients WHERE YEAR(admission_date)=YEAR(CURDATE())
       GROUP BY MONTH(admission_date), MONTHNAME(admission_date) ORDER BY month`
    );
    const [topDoctors] = await pool.query(
      `SELECT d.doctor_id, d.name, d.specialization, COUNT(a.appointment_id) AS total
       FROM doctors d LEFT JOIN appointments a ON d.doctor_id=a.doctor_id
       GROUP BY d.doctor_id, d.name, d.specialization ORDER BY total DESC LIMIT 5`
    );

    res.json({
      total_patients:       totalPatients.c,
      admitted_patients:    admittedPatients.c,
      total_doctors:        totalDoctors.c,
      total_appointments:   totalAppts.c,
      today_appointments:   todayAppts.c,
      patients_with_doctors: patientsWithDoctors,
      revenue:              revenue || {},
      low_stock:            lowStock,
      ward_occupancy:       wardOccupancy,
      monthly_patients:     monthlyPatients,
      top_doctors:          topDoctors,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
