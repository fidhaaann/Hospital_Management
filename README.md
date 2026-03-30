# MediCore Hospital Management System

A full-stack hospital management application built with React, Node.js, Express, and MySQL.

It includes role-based access, patient workflows, appointments, prescriptions, billing, medicines, wards, analytics, and admin user management.

## Highlights

- Modern React dashboard with protected routes
- Session-based authentication with role checks
- Admin-managed accounts (no public self-signup)
- MySQL-backed modules for core hospital operations
- SQL features including joins, views, triggers, and aggregates

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express.js, express-session |
| Database | MySQL 8.0+ (MariaDB compatible) |
| Security | bcryptjs, server-side role middleware |
| Styling | Custom CSS |

## Project Structure

```text
hospital_react/
|-- schema.sql
|-- README.md
|-- server/
|   |-- index.js
|   |-- db.js
|   |-- .env
|   |-- middleware/
|   |   `-- auth.js
|   `-- routes/
|       |-- auth.js
|       |-- dashboard.js
|       |-- patients.js
|       |-- doctors.js
|       |-- appointments.js
|       |-- prescriptions.js
|       |-- bills.js
|       |-- medicines.js
|       |-- wards.js
|       |-- analytics.js
|       `-- users.js
`-- client/
	|-- public/
	|   `-- index.html
	`-- src/
		|-- App.jsx
		|-- index.js
		|-- index.css
		|-- api.js
		|-- context/
		|   `-- AuthContext.jsx
		|-- hooks/
		|   `-- useToast.js
		|-- components/
		|   |-- Layout.jsx
		|   |-- Toast.jsx
		|   `-- ConfirmDialog.jsx
		`-- pages/
			|-- Login.jsx
			|-- Dashboard.jsx
			|-- Patients.jsx
			|-- Doctors.jsx
			|-- Appointments.jsx
			|-- Prescriptions.jsx
			|-- Bills.jsx
			|-- Medicines.jsx
			|-- Wards.jsx
			|-- Analytics.jsx
			`-- Users.jsx
```

## Quick Start

### 1. Prerequisites

- Node.js 18+
- npm
- MySQL 8.0+ (or MariaDB/XAMPP)

### 2. Create Database

Run from project root:

```bash
mysql -u root -p < schema.sql
```

Or import `schema.sql` into a database named `hospital_db` from phpMyAdmin.

### 3. Configure Backend Environment

Create or update `server/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hospital_db
SESSION_SECRET=medicore_hms_change_this
PORT=5000
```

### 4. Install Dependencies

Backend:

```bash
cd server
npm install
```

Frontend:

```bash
cd client
npm install
```

### 5. Run the App

Terminal 1 (backend):

```bash
cd server
npm start
```

Terminal 2 (frontend):

```bash
cd client
npm start
```

App URLs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Default Credentials

| Username | Password | Role |
| --- | --- | --- |
| admin | admin123 | Administrator |
| dr_smith | doctor123 | Doctor |
| receptionist1 | recep123 | Receptionist |

## Role Access Overview

| Module | Admin | Doctor | Receptionist |
| --- | --- | --- | --- |
| Dashboard | Full | Full | Full |
| Patients | Full | View | Full |
| Appointments | Full | View | Full |
| Prescriptions | Full | Full | View |
| Bills | Full | View | Full |
| Doctors | Full | View | View |
| Medicines | Full | View | View |
| Wards | Full | Full | Full |
| Analytics | Full | Full | Full |
| User Management | Full | No | No |

## Core Modules

- Authentication and session management
- Dashboard metrics and operational snapshots
- Patient and doctor management
- Appointment scheduling and status tracking
- Prescriptions and treatment notes
- Billing and medicine mapping
- Ward management and occupancy tracking
- Analytics with aggregated trends
- Admin user creation, edit, and delete

## Database Design Summary

Main tables:

- `users`
- `doctors`
- `patients`
- `appointments`
- `prescriptions`
- `medicines`
- `bills`
- `bill_medicines`
- `wards`

SQL concepts used in the project:

- Multi-table joins
- Aggregate functions with grouping
- Views (`revenue_summary`, `ward_occupancy`, `low_stock_medicines`, `doctor_view`)
- Triggers for billing, stock, and bed allocation updates

## Security Notes

- Passwords are hashed with bcrypt for newly created users.
- Session cookies are HTTP-only.
- Routes are protected using `requireLogin` and `requireRole` middleware.
- Database queries use parameter placeholders to reduce SQL injection risk.
- Change `SESSION_SECRET` before production deployment.

## Troubleshooting

- `ER_ACCESS_DENIED_ERROR`: verify MySQL username/password in `server/.env`.
- Frontend cannot call API: confirm backend is running on port `5000`.
- Login issues after role changes: clear browser cookies and log in again.
- Port conflict: change `PORT` in `server/.env` and update frontend API base URL if needed.

## License

This project is intended for educational and internal use.