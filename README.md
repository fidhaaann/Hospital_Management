# MediCore Hospital Management System

A full-stack hospital management application built with React, Node.js, Express, and MySQL.

The system is designed to provide role-based access for Administrators, Doctors, and Receptionists to manage patient workflows, appointments, prescriptions, billing, medicines, wards, and advanced analytics.

---

## Technical Architecture & Database Features

This application relies heavily on advanced relational database features to maintain data integrity, automate workflows natively, and provide powerful analytical summaries directly from the SQL engine.

Below is an in-depth explanation of every table used, along with the specific database structures and SQL features implemented in this project:

### 1. Tables Used (Core Architecture)
The application architecture is systematically broken down into 10 core relational tables to strictly guarantee normal form and structural purity.

- **`users`**: Stores login credentials, authentication parameters, and roles (`admin`, `doctor`, `receptionist`). Ensures secure access.
- **`doctors`**: Contains medical practitioner profiles (specialization, consultation fees, live availability).
- **`patients`**: Master ledger for all registered patients (demographics, blood group, current admission tracking).
- **`wards`**: Tracks physical hospital infrastructure, mapping total bed capacity versus dynamically available beds.
- **`medicines`**: The master pharmacy inventory table, securely tracking stock quantities, dynamic minimum alert levels, and standard pricing.
- **`appointments`**: Handles scheduling logistics linking a patient to a doctor for a localized time slot and medical reason.
- **`prescriptions`**: Holds official doctor diagnoses and physical medical notes generated after an appointment.
- **`bills`**: Master financial ledger aggregating individual fee components into total, cohesive invoice transactions per patient.
- **`bill_medicines`**: A junction (many-to-many) table tracking exactly which medicines were mapped to which specific bill, allowing line-item inventory reduction.
- **`notifications`**: Stores internal system messages, facilitating staff-to-doctor messaging and asynchronous alerts.

---

### 2. Triggers (Automated Business Logic)
Triggers are used to automatically execute SQL logic in response to standard events (`INSERT`, `UPDATE`, `DELETE`) on a table. 

- **`calculate_total`**
  - *Where Used:* On the **`bills`** table (`BEFORE INSERT`).
  - *Why Used:* To mathematically guarantee that whenever a new bill is created, the `total_amount` is structurally perfect by natively summing up `consultation_fee` + `medicine_charge` + `lab_charge` + `ward_charge` right before the row hits the table.
- **`recalculate_total`**
  - *Where Used:* On the **`bills`** table (`BEFORE UPDATE`).
  - *Why Used:* To protect against humans or bugs altering sub-fees. If someone edits an existing bill's fee components, this intercepts the update and re-totals the overall sum so the final invoice is never mismatched.
- **`reduce_stock`**
  - *Where Used:* On the **`bill_medicines`** junction table (`AFTER INSERT`).
  - *Why Used:* For flawless pharmacy automation. Rather than trusting the node.js server to remember to subtract inventory, the database *itself* automatically deducts the dispatched `quantity` from the parent **`medicines`** table the exact millisecond the item is prescribed onto a bill.
- **`reduce_beds_on_admission`**
  - *Where Used:* On the **`patients`** table (`AFTER INSERT`).
  - *Why Used:* To autonomously manage live hospital capacity. If a new patient's `status` is set to 'Admitted' and a hospital `ward_id` is assigned to them, it instantaneously decrements the `available_beds` count in the corresponding **`wards`** table by 1.
- **`restore_beds_on_discharge`**
  - *Where Used:* On the **`patients`** table (`BEFORE UPDATE`).
  - *Why Used:* To prevent bed tracking desynchronization. If an admitted patient is manually converted to 'Discharged' by a receptionist, this trigger catches the update and autonomously increments the `available_beds` in their previously assigned **`ward`**, freeing up the space dynamically.

### 3. Views (Virtual Tables)
Views encapsulate complex, multi-layered queries into simple, reusable virtual tables. 

- **`revenue_summary`**
  - *Where Used:* Selecting from the **`bills`** table.
  - *Why Used:* To provide the Analytics Dashboard with instantaneous financial data. Instead of writing massive 15-line aggregate queries mathematically summing up "Paid" vs "Pending" totals directly inside the javascript code, the server just runs a simple `SELECT * FROM revenue_summary`.
- **`doctor_view`**
  - *Where Used:* A `JOIN` between the **`patients`** and **`prescriptions`** tables.
  - *Why Used:* For absolute security isolation. It seamlessly provides doctors with an isolated, consolidated snapshot of their specifically treated patients without unnecessarily exposing the entire hospital's underlying administrative or billing data array.
- **`low_stock_medicines`**
  - *Where Used:* Conditionally filtering the **`medicines`** table.
  - *Why Used:* To function as an instant panic-button metric. It exclusively surfaces items where the current `stock_quantity` has accidentally dipped below its pre-defined `minimum_level`, allowing administrative staff to query a singular view to rapidly reorder supplies.
- **`ward_occupancy`**
  - *Where Used:* Calculated directly from the **`wards`** table.
  - *Why Used:* To handle complex fraction / percentage metrics for hospital wards. It determines the mathematical difference of occupied beds (`total_beds` - `available_beds`) and formats the literal occupancy percentage metric necessary for drawing the dashboard UI charts.

### 4. Aggregate Functions
Aggregate functions process vast arrays of multiple rows of data to return a single, structured summary metric. They are extensively utilized across the overarching Analytics dashboards.

- **`COUNT(*)`**: Calculates total frequencies (e.g., the macroscopic sum of registered patients, total tracked appointments, total staff size, or total emitted bills).
- **`SUM(...)`**: Calculates financial or quantitative totals (e.g., `SUM(total_amount)` to quantify total historical hospital revenue, or `SUM(stock_quantity)` for total remaining inventory).
- **`AVG(...)`**: Extracts arithmetic means. Heavily utilized in demographic analytics to determine average patient age or the mean billing costs encountered over periods.
- **`CASE WHEN ... THEN ... END`**: Used inside `SUM()` expressions to conditionally bifurcate data blocks. For example, `SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END)` successfully isolates purely the collected, realized revenue from the holistic pending revenue block without requiring multiple round-trip queries.

### 4. Constraints (Data Integrity)
Constraints enforce rigid structural rules precisely at the database level. This guarantees invalid, orphaned, or illogical data is never successfully inserted.

- **`PRIMARY KEY`**: Applied universally to uniquely, chronologically, and sequentially identify root entries in specific tables (`user_id`, `patient_id`, `doctor_id`, `bill_id`, etc.).
- **`FOREIGN KEY`**: Locks tables into relational networks.
  - *Example:* `ward_id` declared in the `patients` table strictly references `ward_id` within the `wards` table.
  - *Rules:* 
    - `ON DELETE CASCADE` is universally attached to intrinsically dependent tree-records. If a root patient is purged, their sub-prescriptions or specific appointment nodes die automatically alongside them.
    - `ON DELETE SET NULL` is designated for flexible, non-critical assignments. (i.e. retaining a patient's historical visit record but gracefully setting their `doctor_id` to NULL if that doctor officially departs system usage).
- **`UNIQUE`**: Restricts duplicates forcefully. It is applied to the `username` column across the `users` root table, and globally for the `email` column in the `doctors` table, stopping overlapping collisions.
- **`CHECK`**: Enforces strict numeric or string comparative rules directly.
  - `CHECK (age > 0 AND age < 120)`: Assures chronological sense for patient insertions.
  - `CHECK (available_beds >= 0 AND available_beds <= total_beds)`: Strictly prevents mathematically illogical scenarios (like a ward carrying -2 beds, or somehow expanding beyond its hard architected limit).
  - `CHECK (consultation_fee >= 0)`: Bars negative fees that logic dictates shouldn't exist.
- **`ENUM`**: Mutates a traditionally open text column to structurally reject any string not on an approved rigid pre-defined list.
  - `role ENUM('admin', 'doctor', 'receptionist')`
  - `gender ENUM('Male', 'Female', 'Other')`
  - `payment_status ENUM('Pending', 'Paid', 'Partial')`
  - `ward_type ENUM('General', 'ICU', 'Emergency', 'Pediatric', 'Maternity')`

---

## Developer Quick Start

### 1. Requirements
- Node.js 18+
- MySQL 8.0+

### 2. Configure Environment (`server/.env`)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=abc123
DB_NAME=hospital_db
SESSION_SECRET=medicore_hms_change_this
PORT=5000
```

### 3. Start Processes
**Backend Terminal:** `cd server && npm install && npm start`
**Frontend Terminal:** `cd client && npm install && npm start`