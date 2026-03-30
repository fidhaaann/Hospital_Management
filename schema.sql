-- ============================================================
-- MEDICORE HOSPITAL MANAGEMENT SYSTEM — DATABASE SCHEMA
-- Compatible with MySQL 8.0+ and MariaDB 10.6+
-- Run this file ONCE before starting the server:
--   mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id    INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('admin','doctor','receptionist') NOT NULL DEFAULT 'receptionist',
    full_name  VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: doctors
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id        INT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(100)   NOT NULL,
    specialization   VARCHAR(100)   NOT NULL,
    phone            VARCHAR(15)    NOT NULL,
    email            VARCHAR(100)   UNIQUE,
    consultation_fee DECIMAL(10,2)  NOT NULL CHECK (consultation_fee > 0),
    available        BOOLEAN        DEFAULT TRUE,
    created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: wards
-- ============================================================
CREATE TABLE IF NOT EXISTS wards (
    ward_id        INT AUTO_INCREMENT PRIMARY KEY,
    ward_name      VARCHAR(50)  NOT NULL,
    ward_type      ENUM('General','ICU','Emergency','Pediatric','Maternity') NOT NULL,
    total_beds     INT          NOT NULL CHECK (total_beds > 0),
    available_beds INT          NOT NULL,
    charge_per_day DECIMAL(10,2) NOT NULL CHECK (charge_per_day >= 0),
    CHECK (available_beds >= 0 AND available_beds <= total_beds)
);

-- ============================================================
-- TABLE: patients
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    patient_id     INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    age            INT          NOT NULL CHECK (age > 0 AND age < 120),
    gender         ENUM('Male','Female','Other') NOT NULL,
    phone          VARCHAR(15)  NOT NULL,
    address        TEXT,
    blood_group    VARCHAR(5),
    admission_date DATE         NOT NULL,
    discharge_date DATE,
    ward_id        INT,
    status         ENUM('Admitted','Discharged','Outpatient') DEFAULT 'Outpatient',
    FOREIGN KEY (ward_id) REFERENCES wards(ward_id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE: appointments
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id   INT AUTO_INCREMENT PRIMARY KEY,
    patient_id       INT          NOT NULL,
    doctor_id        INT          NOT NULL,
    appointment_date DATE         NOT NULL,
    appointment_time TIME         NOT NULL,
    reason           VARCHAR(255),
    status           ENUM('Scheduled','Completed','Cancelled') DEFAULT 'Scheduled',
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(doctor_id)   ON DELETE CASCADE,
    CONSTRAINT unique_doctor_time UNIQUE (doctor_id, appointment_date, appointment_time)
);

-- ============================================================
-- TABLE: prescriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS prescriptions (
    prescription_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      INT  NOT NULL,
    doctor_id       INT  NOT NULL,
    diagnosis       TEXT NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(doctor_id)   ON DELETE CASCADE
);

-- ============================================================
-- TABLE: medicines
-- ============================================================
CREATE TABLE IF NOT EXISTS medicines (
    medicine_id    INT AUTO_INCREMENT PRIMARY KEY,
    medicine_name  VARCHAR(100)  NOT NULL,
    stock_quantity INT           NOT NULL CHECK (stock_quantity >= 0),
    minimum_level  INT           NOT NULL DEFAULT 10,
    price          DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    unit           VARCHAR(20)   DEFAULT 'tablets'
);

-- ============================================================
-- TABLE: bills
-- ============================================================
CREATE TABLE IF NOT EXISTS bills (
    bill_id          INT AUTO_INCREMENT PRIMARY KEY,
    patient_id       INT           NOT NULL,
    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (consultation_fee >= 0),
    medicine_charge  DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (medicine_charge  >= 0),
    lab_charge       DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (lab_charge       >= 0),
    ward_charge      DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (ward_charge      >= 0),
    total_amount     DECIMAL(10,2) DEFAULT 0 CHECK (total_amount >= 0),
    payment_status   ENUM('Pending','Paid','Partial') DEFAULT 'Pending',
    bill_date        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: bill_medicines (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS bill_medicines (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    bill_id     INT           NOT NULL,
    medicine_id INT           NOT NULL,
    quantity    INT           NOT NULL CHECK (quantity > 0),
    unit_price  DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (bill_id)     REFERENCES bills(bill_id)         ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) ON DELETE CASCADE
);

-- ============================================================
-- TRIGGER 1: Auto-calculate total on INSERT
-- ============================================================
DELIMITER $$
CREATE TRIGGER calculate_total
BEFORE INSERT ON bills FOR EACH ROW
BEGIN
    SET NEW.total_amount = NEW.consultation_fee + NEW.medicine_charge + NEW.lab_charge + NEW.ward_charge;
END$$
DELIMITER ;

-- ============================================================
-- TRIGGER 2: Recalculate total on UPDATE
-- ============================================================
DELIMITER $$
CREATE TRIGGER recalculate_total
BEFORE UPDATE ON bills FOR EACH ROW
BEGIN
    SET NEW.total_amount = NEW.consultation_fee + NEW.medicine_charge + NEW.lab_charge + NEW.ward_charge;
END$$
DELIMITER ;

-- ============================================================
-- TRIGGER 3: Reduce medicine stock after billing
-- ============================================================
DELIMITER $$
CREATE TRIGGER reduce_stock
AFTER INSERT ON bill_medicines FOR EACH ROW
BEGIN
    UPDATE medicines
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE medicine_id = NEW.medicine_id;
END$$
DELIMITER ;

-- ============================================================
-- TRIGGER 4: Reduce available beds on patient admission
-- ============================================================
DELIMITER $$
CREATE TRIGGER reduce_beds_on_admission
AFTER INSERT ON patients FOR EACH ROW
BEGIN
    IF NEW.ward_id IS NOT NULL AND NEW.status = 'Admitted' THEN
        UPDATE wards SET available_beds = available_beds - 1 WHERE ward_id = NEW.ward_id;
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- TRIGGER 5: Restore beds when patient is discharged
-- ============================================================
DELIMITER $$
CREATE TRIGGER restore_beds_on_discharge
BEFORE UPDATE ON patients FOR EACH ROW
BEGIN
    IF NEW.status = 'Discharged' AND OLD.status = 'Admitted' AND OLD.ward_id IS NOT NULL THEN
        UPDATE wards SET available_beds = available_beds + 1 WHERE ward_id = OLD.ward_id;
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- VIEW 1: Revenue summary (SUM, AVG, COUNT, CASE)
-- ============================================================
CREATE VIEW revenue_summary AS
SELECT
    COUNT(*)                                                                           AS total_bills,
    COALESCE(SUM(total_amount), 0)                                                     AS total_revenue,
    COALESCE(AVG(total_amount), 0)                                                     AS avg_bill_amount,
    COALESCE(SUM(CASE WHEN payment_status='Paid'    THEN total_amount ELSE 0 END), 0)  AS collected_revenue,
    COALESCE(SUM(CASE WHEN payment_status='Pending' THEN total_amount ELSE 0 END), 0)  AS pending_revenue
FROM bills;

-- ============================================================
-- VIEW 2: Doctor + patient prescription view
-- ============================================================
CREATE VIEW doctor_view AS
SELECT
    p.patient_id, p.name AS patient_name, p.age, p.gender,
    pr.diagnosis, pr.notes, pr.created_at
FROM patients p
JOIN prescriptions pr ON p.patient_id = pr.patient_id;

-- ============================================================
-- VIEW 3: Low-stock medicines alert
-- ============================================================
CREATE VIEW low_stock_medicines AS
SELECT medicine_id, medicine_name, stock_quantity, minimum_level, price
FROM medicines
WHERE stock_quantity < minimum_level;

-- ============================================================
-- VIEW 4: Ward occupancy (derived column)
-- ============================================================
CREATE VIEW ward_occupancy AS
SELECT
    ward_id, ward_name, ward_type, total_beds, available_beds,
    (total_beds - available_beds) AS occupied_beds,
    ROUND(((total_beds - available_beds) / total_beds) * 100, 1) AS occupancy_percent
FROM wards;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO users (username, password, role, full_name) VALUES
('admin',          'admin123',   'admin',         'System Administrator'),
('dr_smith',       'doctor123',  'doctor',         'Dr. John Smith'),
('receptionist1',  'recep123',   'receptionist',   'Sarah Johnson');

INSERT INTO doctors (name, specialization, phone, email, consultation_fee) VALUES
('Dr. John Smith',   'Cardiology',       '9876543210', 'john.smith@hospital.com',   800.00),
('Dr. Priya Nair',   'Pediatrics',       '9876543211', 'priya.nair@hospital.com',   600.00),
('Dr. Rahul Verma',  'Orthopedics',      '9876543212', 'rahul.verma@hospital.com',  700.00),
('Dr. Anjali Menon', 'Neurology',        '9876543213', 'anjali.menon@hospital.com', 900.00),
('Dr. Suresh Kumar', 'General Medicine', '9876543214', 'suresh.kumar@hospital.com', 500.00);

INSERT INTO wards (ward_name, ward_type, total_beds, available_beds, charge_per_day) VALUES
('Ward A',        'General',   20, 15, 500.00),
('Ward B',        'General',   15, 10, 500.00),
('ICU-1',         'ICU',       10,  6, 2000.00),
('Emergency',     'Emergency',  8,  5, 1500.00),
('Pediatric Ward','Pediatric', 12,  9, 800.00);

INSERT INTO medicines (medicine_name, stock_quantity, minimum_level, price, unit) VALUES
('Paracetamol 500mg',  500, 50,  2.50, 'tablets'),
('Amoxicillin 250mg',  200, 30,  8.00, 'capsules'),
('Ibuprofen 400mg',    300, 40,  3.50, 'tablets'),
('Omeprazole 20mg',    150, 25,  5.00, 'capsules'),
('Metformin 500mg',     80, 50,  4.00, 'tablets'),
('Cetirizine 10mg',    400, 30,  2.00, 'tablets'),
('Aspirin 75mg',       250, 40,  1.50, 'tablets'),
('Insulin (Vial)',      15, 20, 250.00,'vials');
