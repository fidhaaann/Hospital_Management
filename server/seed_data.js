const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'abc123',
  database: process.env.DB_NAME || 'hospital_db',
  charset: 'utf8mb4'
});

const fNames = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Charles", "Joseph", "Thomas", "Christopher", "Daniel", "Paul", "Mark", "Donald", "Mary", "Patricia", "Linda", "Barbara", "Elizabeth", "Jennifer", "Maria", "Susan", "Margaret", "Dorothy", "Lisa", "Nancy", "Karen", "Betty", "Helen"];
const lNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez"];

function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randPhone() { return '9' + String(randInt(100000000, 999999999)); }

async function seed() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("Connected. Wiping old data...");

    // Disable foreign keys temporarily for truncation
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE bill_medicines');
    await conn.query('TRUNCATE TABLE bills');
    await conn.query('TRUNCATE TABLE medicines');
    await conn.query('TRUNCATE TABLE prescriptions');
    await conn.query('TRUNCATE TABLE appointments');
    await conn.query('TRUNCATE TABLE patients');
    await conn.query('TRUNCATE TABLE wards');
    await conn.query('TRUNCATE TABLE doctors');
    await conn.query('TRUNCATE TABLE notifications');
    await conn.query('TRUNCATE TABLE users');

    console.log("Data wiped. Seeding Users and Doctors...");
    const adminPass = await bcrypt.hash('admin123', 10);
    await conn.query(`INSERT INTO users (username, password, role, full_name) VALUES ('admin', ?, 'admin', 'System Administrator')`, [adminPass]);

    for(let i=1; i<=25; i++) {
      const first = randItem(fNames);
      const last = randItem(lNames);
      const full = `Dr. ${first} ${last}`;
      const user = `${first.toLowerCase()}${i}`;
      const pass = await bcrypt.hash('password123', 10);
      
      await conn.query(`INSERT INTO users (username, password, role, full_name) VALUES (?, ?, 'doctor', ?)`, [user, pass, full]);
      
      const spec = randItem(['Cardiology', 'Pediatrics', 'Orthopedics', 'Neurology', 'General Medicine', 'Dermatology', 'Oncology', 'Psychiatry']);
      const phone = randPhone();
      const email = `${first.toLowerCase()}.${last.toLowerCase()}@hospital.com`;
      const fee = randInt(2, 9) * 100;
      await conn.query(`INSERT INTO doctors (name, specialization, phone, email, consultation_fee, available) VALUES (?, ?, ?, ?, ?, 1)`, [full, spec, phone, email, fee]);
    }

    for(let i=1; i<=25; i++) {
        const first = randItem(fNames);
        const last = randItem(lNames);
        const full = `${first} ${last}`;
        const pass = await bcrypt.hash('password123', 10);
        try {
           await conn.query(`INSERT INTO users (username, password, role, full_name) VALUES (?, ?, 'receptionist', ?)`, [`${first.toLowerCase()}staff${i}`, pass, full]);
        } catch(e) {}
    }

    console.log("Seeding Wards...");
    for(let i=1; i<=25; i++) {
        const wType = randItem(['General','ICU','Emergency','Pediatric','Maternity']);
        const wName = `${wType} Ward ${i}`;
        const total = randInt(10, 50);
        const charge = randInt(5, 20) * 100;
        await conn.query(`INSERT INTO wards (ward_name, ward_type, total_beds, available_beds, charge_per_day) VALUES (?, ?, ?, ?, ?)`, [wName, wType, total, total, charge]);
    }

    console.log("Seeding Patients...");
    for(let i=1; i<=25; i++) {
        const full = `${randItem(fNames)} ${randItem(lNames)}`;
        const age = randInt(5, 80);
        const gender = randItem(['Male','Female']);
        const phone = randPhone();
        const address = `${randInt(1, 999)} Main St, City`;
        const blood = randItem(['A+','A-','B+','B-','O+','O-','AB+','AB-']);
        const t = new Date(); t.setDate(t.getDate() - randInt(1, 30));
        const admDate = t.toISOString().split('T')[0];
        const status = randItem(['Admitted','Discharged','Outpatient']);
        let wId = null;
        if (status === 'Admitted') wId = randInt(1, 25);
        
        await conn.query(`INSERT INTO patients (name, age, gender, phone, address, blood_group, admission_date, ward_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                         [full, age, gender, phone, address, blood, admDate, wId, status]);
    }

    console.log("Seeding Medicines...");
    for(let i=1; i<=25; i++) {
        const meds = ["Paracetamol", "Amoxicillin", "Ibuprofen", "Omeprazole", "Metformin", "Cetirizine", "Aspirin", "Insulin"];
        const name = `${randItem(meds)} ${randInt(1,5)*100}mg Brand${i}`;
        const stock = randInt(10, 500);
        const minLvl = 50;
        const price = randInt(2, 50) + 0.5;
        const unit = randItem(['tablets', 'capsules', 'vials', 'bottles']);
        await conn.query(`INSERT INTO medicines (medicine_name, stock_quantity, minimum_level, price, unit) VALUES (?, ?, ?, ?, ?)`, [name, stock, minLvl, price, unit]);
    }

    console.log("Seeding Appointments...");
    for(let i=1; i<=25; i++) {
        const pId = randInt(1, 25);
        const dId = randInt(1, 25);
        const t = new Date(); t.setDate(t.getDate() + randInt(0, 14));
        const aDate = t.toISOString().split('T')[0];
        const aTime = `${String(randInt(9, 16)).padStart(2, '0')}:00:00`;
        const reason = "Checkup for " + randItem(['fever', 'headache', 'back pain', 'cough', 'injury']);
        const status = randItem(['Scheduled', 'Completed', 'Cancelled']);
        try {
           await conn.query(`INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status) VALUES (?, ?, ?, ?, ?, ?)`, [pId, dId, aDate, aTime, reason, status]);
        } catch(e) {}
    }

    console.log("Seeding Prescriptions and Bills...");
    for(let i=1; i<=25; i++) {
        const pId = randInt(1, 25);
        const dId = randInt(1, 25);
        const diag = "Diagnosis Number " + i;
        const notes = "Take plenty of rest and stay hydrated. " + randItem(['Avoid cold drinks.', 'Take meds after meal.', 'Return after 1 week.']);
        await conn.query(`INSERT INTO prescriptions (patient_id, doctor_id, diagnosis, notes) VALUES (?, ?, ?, ?)`, [pId, dId, diag, notes]);
        
        const cf = randInt(2, 6) * 100;
        const mc = randInt(1, 5) * 50;
        const lc = randInt(0, 2) * 500;
        const wc = randInt(0, 3) * 1000;
        const pStat = randItem(['Pending', 'Paid', 'Partial']);
        
        const [bRes] = await conn.query(`INSERT INTO bills (patient_id, consultation_fee, medicine_charge, lab_charge, ward_charge, payment_status) VALUES (?, ?, ?, ?, ?, ?)`, [pId, cf, mc, lc, wc, pStat]);
        const billId = bRes.insertId;
        
        for(let m=0; m<randInt(1, 3); m++) {
            const mId = randInt(1, 25);
            const q = randInt(1, 5);
            const price = randInt(5, 25) + 0.50;
            try {
                await conn.query(`INSERT INTO bill_medicines (bill_id, medicine_id, quantity, unit_price) VALUES (?, ?, ?, ?)`, [billId, mId, q, price]);
            } catch(e) {}
        }
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log("Database seeded successfully!");

  } catch (err) {
    console.error("Error seeding DB:", err);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}

seed();
