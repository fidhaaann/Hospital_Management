const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const session = require('express-session');
const cors    = require('cors');


const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'medicore_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 8 * 60 * 60 * 1000 }, // 8 hours
}));

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/patients',      require('./routes/patients'));
app.use('/api/doctors',       require('./routes/doctors'));
app.use('/api/appointments',  require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/bills',         require('./routes/bills'));
app.use('/api/medicines',     require('./routes/medicines'));
app.use('/api/wards',         require('./routes/wards'));
app.use('/api/analytics',     require('./routes/analytics'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🏥  MediCore HMS API running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
