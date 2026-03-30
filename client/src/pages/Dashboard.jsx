import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';

function StatCard({ label, value, icon, gc }) {
  return (
    <div className={`stat-card ${gc}`}>
      <p>{label}</p>
      <h3>{value ?? 0}</h3>
      <i className={`fas ${icon} bg-icon`} />
    </div>
  );
}

function AggCard({ icon, iconBg, value, label }) {
  return (
    <div className="agg-card">
      <div className="agg-icon" style={{ background: iconBg }}>
        <i className={`fas ${icon}`} style={{ color: '#fff' }} />
      </div>
      <div>
        <div className="agg-val">{value ?? '—'}</div>
        <div className="agg-lbl">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard({ toast }) {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientStatusFilter, setPatientStatusFilter] = useState('all');

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setStats(r.data))
      .catch(e => toast?.(e.response?.data?.error || 'Failed to load dashboard', 'danger'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout pageTitle="Dashboard">
      <div className="spinner-wrap"><div className="spinner" /></div>
    </Layout>
  );

  const s = stats || {};
  const maxMonth = s.monthly_patients?.length ? Math.max(...s.monthly_patients.map(m => m.count)) : 1;
  const filteredRecentPatients = (s.patients_with_doctors || []).filter(p => {
    const q = patientSearch.trim().toLowerCase();
    const matchText = !q
      || String(p.patient_name || '').toLowerCase().includes(q)
      || String(p.doctor_name || '').toLowerCase().includes(q)
      || String(p.patient_id).includes(q);
    const matchStatus = patientStatusFilter === 'all' || String(p.status) === patientStatusFilter;
    return matchText && matchStatus;
  });

  return (
    <Layout pageTitle={<><i className="fas fa-chart-line" style={{ color: 'var(--accent)', marginRight: 8 }} />Dashboard</>}>

      {/* Low stock banner */}
      {s.low_stock?.length > 0 && (
        <div className="low-stock-banner">
          <i className="fas fa-triangle-exclamation" />
          <strong>Low Stock Alert:</strong>
          {s.low_stock.map(m => (
            <span key={m.medicine_id} className="badge badge-low" style={{ marginLeft: 4 }}>
              {m.medicine_name} ({m.stock_quantity} left)
            </span>
          ))}
        </div>
      )}

      {/* Stat cards row */}
      <div className="row row-4" style={{ marginBottom: 20 }}>
        <StatCard label="Total Patients"  value={s.total_patients}      icon="fa-user-injured"   gc="gc-green" />
        <StatCard label="Admitted Now"    value={s.admitted_patients}   icon="fa-bed"            gc="gc-cyan"  />
        <StatCard label="Doctors"         value={s.total_doctors}       icon="fa-user-md"        gc="gc-amber" />
        <StatCard label="Today's Appts"   value={s.today_appointments}  icon="fa-calendar-check" gc="gc-red"   />
      </div>

      {/* Agg cards row */}
      <div className="row row-4" style={{ marginBottom: 24 }}>
        <AggCard icon="fa-calendar-alt"    iconBg="#1a6b4a" value={s.total_appointments}               label="Total Appointments" />
        <AggCard icon="fa-rupee-sign"      iconBg="#0e7490" value={`₹${Math.round(s.revenue?.total_revenue || 0).toLocaleString()}`} label="Total Revenue" />
        <AggCard icon="fa-clock"           iconBg="#b45309" value={`₹${Math.round(s.revenue?.pending_revenue || 0).toLocaleString()}`} label="Pending Revenue" />
        <AggCard icon="fa-check-circle"    iconBg="#15803d" value={`₹${Math.round(s.revenue?.collected_revenue || 0).toLocaleString()}`} label="Collected Revenue" />
      </div>

      <div className="row row-2" style={{ marginBottom: 24 }}>
        {/* Monthly patients mini-bar chart */}
        <div className="card">
          <div className="card-header"><i className="fas fa-chart-bar" />Monthly Patient Admissions</div>
          <div className="card-body">
            {s.monthly_patients?.length ? s.monthly_patients.map(m => (
              <div key={m.month} style={{ marginBottom: 10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', marginBottom: 3 }}>
                  <span>{m.month_name}</span><strong>{m.count}</strong>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${(m.count / maxMonth) * 100}%` }} />
                </div>
              </div>
            )) : <p className="text-muted" style={{ fontSize:'0.85rem' }}>No data for this year yet.</p>}
          </div>
        </div>

        {/* Top doctors */}
        <div className="card">
          <div className="card-header"><i className="fas fa-trophy" />Top Doctors by Appointments</div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead><tr><th>Doctor</th><th>Specialization</th><th>Appointments</th></tr></thead>
              <tbody>
                {s.top_doctors?.length ? s.top_doctors.map((d, i) => (
                  <tr key={i}>
                    <td><strong>{d.name}</strong></td>
                    <td className="text-muted">{d.specialization}</td>
                    <td><span className="badge badge-outpatient">{d.total}</span></td>
                  </tr>
                )) : <tr><td colSpan={3} className="text-muted" style={{ textAlign:'center', padding:24 }}>No data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Patient-Doctor JOIN table */}
      <div className="card">
        <div className="card-header">
          <i className="fas fa-link" />
          Recent Patients — Doctor Assignment
          <span style={{ marginLeft: 8, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            SQL: LEFT JOIN patients ← appointments → doctors
          </span>
        </div>
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <input
              className="form-control"
              placeholder="Search by patient name, doctor, or ID"
              value={patientSearch}
              onChange={e => setPatientSearch(e.target.value)}
            />
            <select className="form-select" value={patientStatusFilter} onChange={e => setPatientStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="Outpatient">Outpatient</option>
              <option value="Admitted">Admitted</option>
              <option value="Discharged">Discharged</option>
            </select>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Patient</th><th>Age/Gender</th><th>Status</th><th>Admission</th><th>Doctor</th><th>Specialization</th></tr>
            </thead>
            <tbody>
              {filteredRecentPatients.length ? filteredRecentPatients.map(p => (
                <tr key={p.patient_id}>
                  <td className="text-muted font-mono" style={{ fontSize:'0.75rem' }}>#{p.patient_id}</td>
                  <td><strong>{p.patient_name}</strong></td>
                  <td>{p.age} / {p.gender}</td>
                  <td><span className={`badge badge-${p.status?.toLowerCase()}`}>{p.status}</span></td>
                  <td style={{ fontSize:'0.8rem' }}>{p.admission_date ? new Date(p.admission_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td>{p.doctor_name || <span className="text-muted">Unassigned</span>}</td>
                  <td className="text-muted" style={{ fontSize:'0.8rem' }}>{p.specialization || '—'}</td>
                </tr>
              )) : <tr><td colSpan={7} style={{ textAlign:'center', padding:24 }} className="text-muted">No patients match the filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ward occupancy */}
      {s.ward_occupancy?.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header"><i className="fas fa-bed" />Ward Occupancy</div>
          <div className="row row-4" style={{ padding: 20, gap: 12 }}>
            {s.ward_occupancy.map(w => (
              <div key={w.ward_id} style={{ background:'var(--surface-2)', borderRadius:10, padding:'14px 16px', border:'1px solid var(--border)' }}>
                <div style={{ fontWeight:600, marginBottom:4 }}>{w.ward_name}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:8 }}>{w.ward_type}</div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:5 }}>
                  <span>{w.occupied_beds}/{w.total_beds} beds</span>
                  <strong style={{ color: w.occupancy_percent >= 90 ? 'var(--danger)' : 'var(--primary-mid)' }}>
                    {w.occupancy_percent}%
                  </strong>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{
                    width:`${w.occupancy_percent}%`,
                    background: w.occupancy_percent >= 90 ? 'var(--danger)' : w.occupancy_percent >= 70 ? 'var(--warning)' : undefined,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
