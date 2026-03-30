const router = require('express').Router();
const pool = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');

router.get('/', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, p.name AS patient_name FROM bills b
       JOIN patients p ON b.patient_id = p.patient_id
       ORDER BY b.bill_date DESC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireLogin, requireRole('admin', 'receptionist'), async (req, res) => {
  const { patient_id, consultation_fee, lab_charge, ward_charge, medicines } = req.body;
  // medicines = [{ medicine_id, quantity }]
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Calculate medicine charge
    let medicine_charge = 0;
    const medItems = [];
    for (const item of (medicines || [])) {
      if (item.medicine_id && item.quantity) {
        const [[med]] = await conn.query('SELECT price FROM medicines WHERE medicine_id=?', [item.medicine_id]);
        if (med) {
          const lineTotal = parseFloat(med.price) * parseInt(item.quantity);
          medicine_charge += lineTotal;
          medItems.push({ medicine_id: item.medicine_id, quantity: item.quantity, unit_price: med.price });
        }
      }
    }

    const [result] = await conn.query(
      'INSERT INTO bills (patient_id, consultation_fee, medicine_charge, lab_charge, ward_charge) VALUES (?,?,?,?,?)',
      [patient_id, parseFloat(consultation_fee) || 0, medicine_charge, parseFloat(lab_charge) || 0, parseFloat(ward_charge) || 0]
    );
    const bill_id = result.insertId;

    for (const item of medItems) {
      await conn.query(
        'INSERT INTO bill_medicines (bill_id, medicine_id, quantity, unit_price) VALUES (?,?,?,?)',
        [bill_id, item.medicine_id, item.quantity, item.unit_price]
      );
    }

    await conn.commit();
    res.json({ message: `Bill #${bill_id} generated successfully.`, bill_id });
  } catch (e) {
    await conn.rollback();
    if (e.message.includes('stock_quantity') || e.message.includes('45000'))
      return res.status(400).json({ error: 'Insufficient medicine stock!' });
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

router.patch('/:id/payment', requireLogin, requireRole('admin', 'receptionist'), async (req, res) => {
  const { status } = req.body;
  if (!['Paid', 'Pending', 'Partial'].includes(status))
    return res.status(400).json({ error: 'Invalid payment status.' });
  try {
    await pool.query('UPDATE bills SET payment_status=? WHERE bill_id=?', [status, req.params.id]);
    res.json({ message: 'Payment status updated.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
