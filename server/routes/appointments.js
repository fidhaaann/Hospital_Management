const router = require('express').Router();
const pool = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');

function formatTime(t) {
  if (!t) return '—';
  // mysql2 returns TIME as string "HH:MM:SS"
  const [hh, mm] = String(t).split(':').map(Number);
  const period = hh < 12 ? 'AM' : 'PM';
  const h = hh % 12 || 12;
  return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')} ${period}`;
}

router.get('/', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, p.name AS patient_name, d.name AS doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       ORDER BY a.appointment_date DESC, a.appointment_time ASC`
    );
    const formatted = rows.map(r => ({ ...r, appointment_time_fmt: formatTime(r.appointment_time) }));
    res.json(formatted);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireLogin, requireRole('admin', 'receptionist'), async (req, res) => {
  const { patient_id, doctor_id, appointment_date, appointment_time, reason } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason) VALUES (?,?,?,?,?)',
      [patient_id, doctor_id, appointment_date, appointment_time, reason || '']
    );
    res.json({ message: 'Appointment scheduled.', appointment_id: result.insertId });
  } catch (e) {
    if (e.message.includes('unique_doctor_time'))
      return res.status(409).json({ error: 'Conflict! Doctor already has an appointment at this date and time.' });
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id/status', requireLogin, async (req, res) => {
  const { status } = req.body;
  if (!['Scheduled', 'Completed', 'Cancelled'].includes(status))
    return res.status(400).json({ error: 'Invalid status.' });
  try {
    await pool.query('UPDATE appointments SET status=? WHERE appointment_id=?', [status, req.params.id]);
    res.json({ message: 'Status updated.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
