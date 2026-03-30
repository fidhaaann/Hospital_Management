const router = require('express').Router();
const pool = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');

router.get('/', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medicines ORDER BY medicine_name');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireLogin, requireRole('admin'), async (req, res) => {
  const { medicine_name, stock_quantity, minimum_level, price, unit } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO medicines (medicine_name, stock_quantity, minimum_level, price, unit) VALUES (?,?,?,?,?)',
      [medicine_name, stock_quantity, minimum_level, price, unit || 'tablets']
    );
    res.json({ message: 'Medicine added.', medicine_id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireLogin, requireRole('admin'), async (req, res) => {
  const { medicine_name, stock_quantity, minimum_level, price, unit } = req.body;
  try {
    await pool.query(
      'UPDATE medicines SET medicine_name=?, stock_quantity=?, minimum_level=?, price=?, unit=? WHERE medicine_id=?',
      [medicine_name, stock_quantity, minimum_level, price, unit || 'tablets', req.params.id]
    );
    res.json({ message: 'Medicine updated.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
