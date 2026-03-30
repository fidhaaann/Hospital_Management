import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';

function AnimatedCounter({ value, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const end = Number(String(value).replace(/[^0-9.-]+/g, '')) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }
    
    let current = 0;
    const duration = 1500; // ms
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <>{prefix}{count.toLocaleString()}{suffix}</>;
}

function StatCard({ label, value, icon, gc }) {
  return (
    <div className={`stat-card ${gc}`}>
      <p>{label}</p>
      <h3><AnimatedCounter value={value} /></h3>
      <i className={`fas ${icon} bg-icon`} />
    </div>
  );
}

function AggCard({ icon, iconBg, value, label, prefix = '' }) {
  return (
    <div className="agg-card">
      <div className="agg-icon" style={{ background: iconBg }}>
        <i className={`fas ${icon}`} style={{ color: '#fff' }} />
      </div>
      <div>
        <div className="agg-val"><AnimatedCounter value={value} prefix={prefix} /></div>
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
  }, [toast]);

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
    <Layout pageTitle={<><i className="fas fa-chart-line" style={{ color: 'var(--accent-primary)', marginRight: 12 }} />Dashboard Overview</>}>

      {/* Low stock banner */}
      {s.low_stock?.length > 0 && (
        <div className="alert alert-warning" style={{ alignItems: 'center' }}>
          <i className="fas fa-triangle-exclamation" style={{ fontSize: '1.2rem' }} />
          <div style={{ flex: 1 }}>
             <strong style={{ marginRight: 8, fontWeight: 700 }}>Low Pharmacy Stock Alert:</strong>
             {s.low_stock.map(m => (
               <span key={m.medicine_id} className="badge badge-low" style={{ margin: '0 4px', padding: '4px 10px' }}>
                 {m.medicine_name} ({m.stock_quantity} left)
               </span>
             ))}
          </div>
        </div>
      )}

      {/* Stat cards row */}
      <div className="row row-4" style={{ marginBottom: 32 }}>
        <StatCard label="Total Patients"  value={s.total_patients}      icon="fa-user-injured"   gc="gc-green" />
        <StatCard label="Active Beds"     value={s.admitted_patients}   icon="fa-procedures"     gc="gc-cyan"  />
        <StatCard label="Staff On-Duty"   value={s.total_doctors}       icon="fa-user-md"        gc="gc-amber" />
        <StatCard label="Today's Appts"   value={s.today_appointments}  icon="fa-calendar-check" gc="gc-red"   />
      </div>

      {/* Agg cards row */}
      <div className="row row-4" style={{ marginBottom: 32 }}>
        <AggCard icon="fa-calendar-alt"    iconBg="var(--accent-secondary)" value={s.total_appointments}               label="Total Appointments" />
        <AggCard icon="fa-rupee-sign"      iconBg="var(--info)"             value={Math.round(s.revenue?.total_revenue || 0)}     label="Total Revenue" prefix="₹" />
        <AggCard icon="fa-clock"           iconBg="var(--warning)"          value={Math.round(s.revenue?.pending_revenue || 0)}   label="Pending Revenue" prefix="₹" />
        <AggCard icon="fa-check-circle"    iconBg="var(--accent-primary)"   value={Math.round(s.revenue?.collected_revenue || 0)} label="Collected Revenue" prefix="₹" />
      </div>

      <div className="row row-2" style={{ marginBottom: 32 }}>
        {/* Monthly patients mini-bar chart */}
        <div className="card" style={{ animationDelay: '0.1s' }}>
          <div className="card-header"><><i className="fas fa-chart-area" style={{ color: 'var(--accent-primary)' }} /> Monthly Admissions</></div>
          <div className="card-body">
            {s.monthly_patients?.length ? s.monthly_patients.map((m, idx) => (
              <div key={m.month} style={{ marginBottom: 16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginBottom: 6, fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{m.month_name}</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}><AnimatedCounter value={m.count} /></strong>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: 0, animation: `fillBar${idx} 1s ease-out ${0.2 + idx * 0.1}s forwards` }}>
                     <style>{`@keyframes fillBar${idx} { to { width: ${(m.count / maxMonth) * 100}% } }`}</style>
                  </div>
                </div>
              </div>
            )) : <div className="empty-state"><i className="fas fa-chart-area" /><p>No data for this year yet.</p></div>}
          </div>
        </div>

        {/* Top doctors */}
        <div className="card" style={{ animationDelay: '0.2s' }}>
          <div className="card-header"><><i className="fas fa-trophy" style={{ color: 'var(--warning)' }} /> Top Doctors</></div>
          <div className="tbl-wrap" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
            <table style={{ margin: 0 }}>
              <thead><tr><th style={{ background: 'transparent' }}>Doctor</th><th style={{ background: 'transparent' }}>Specialization</th><th style={{ textAlign: 'right', background: 'transparent' }}>Cases</th></tr></thead>
              <tbody>
                {s.top_doctors?.length ? s.top_doctors.map((d, i) => (
                  <tr key={i}>
                    <td><strong style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                       <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-hover)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', fontSize: '0.8rem' }}>{d.name.replace('Dr. ', '').charAt(0) || 'D'}</span>
                       {d.name}
                    </strong></td>
                    <td className="text-secondary">{d.specialization}</td>
                    <td style={{ textAlign: 'right' }}><span className="badge badge-outpatient" style={{ padding: '6px 12px', fontSize: '0.8rem' }}><AnimatedCounter value={d.total} /></span></td>
                  </tr>
                )) : <tr><td colSpan={3} className="text-muted" style={{ textAlign:'center', padding:32 }}>No data available</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Patient-Doctor JOIN table */}
      <div className="card" style={{ marginBottom: 32, animationDelay: '0.3s' }}>
        <div className="card-header">
           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             <i className="fas fa-procedures" style={{ color: 'var(--accent-primary)' }} />
             Admissions Overview
           </div>
        </div>
        <div className="card-body" style={{ paddingBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 220px', gap: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
               <div style={{ position: 'relative' }}>
                  <i className="fas fa-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                  <input
                    className="form-control"
                    style={{ paddingLeft: 46 }}
                    placeholder="Search by patient name, doctor, or ID..."
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                  />
               </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
               <select className="form-select" value={patientStatusFilter} onChange={e => setPatientStatusFilter(e.target.value)}>
                 <option value="all">All Status</option>
                 <option value="Outpatient">Outpatient</option>
                 <option value="Admitted">Admitted</option>
                 <option value="Discharged">Discharged</option>
               </select>
            </div>
          </div>
        </div>
        <div className="tbl-wrap" style={{ margin: 0, border: 'none', borderRadius: 0, borderTop: '1px solid var(--border)' }}>
          <table style={{ margin: 0 }}>
            <thead>
              <tr><th style={{ background: 'transparent' }}>#ID</th><th style={{ background: 'transparent' }}>Patient</th><th style={{ background: 'transparent' }}>Vitals (Age/Sex)</th><th style={{ background: 'transparent' }}>Status</th><th style={{ background: 'transparent' }}>Admission</th><th style={{ background: 'transparent' }}>Assigned Doctor</th><th style={{ background: 'transparent' }}>Dept</th></tr>
            </thead>
            <tbody>
              {filteredRecentPatients.length ? filteredRecentPatients.map(p => (
                <tr key={p.patient_id}>
                  <td className="font-mono" style={{ color: 'var(--text-muted)', fontSize:'0.85rem' }}>#{String(p.patient_id).padStart(4, '0')}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.patient_name}</td>
                  <td>{p.age} yrs / {p.gender.charAt(0)}</td>
                  <td><span className={`badge badge-${p.status?.toLowerCase()}`}>{p.status}</span></td>
                  <td className="font-mono" style={{ fontSize: '0.85rem' }}>{p.admission_date ? new Date(p.admission_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                  <td style={{ fontWeight: 600 }}>{p.doctor_name ? `Dr. ${p.doctor_name.replace('Dr. ', '')}` : <span className="text-muted" style={{ fontWeight: 400 }}>Unassigned</span>}</td>
                  <td className="text-secondary" style={{ fontSize: '0.85rem' }}>{p.specialization || '—'}</td>
                </tr>
              )) : <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color: 'var(--text-muted)' }}>No patients match the filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ward occupancy */}
      {s.ward_occupancy?.length > 0 && (
        <div className="card" style={{ marginTop: 32, animationDelay: '0.4s' }}>
          <div className="card-header"><><i className="fas fa-bed" style={{ color: 'var(--accent-secondary)' }} /> Ward Occupancy</></div>
          <div className="row row-4" style={{ padding: 24, gap: 20 }}>
            {s.ward_occupancy.map(w => (
              <div key={w.ward_id} style={{ 
                 background:'var(--surface-hover)', borderRadius: 'var(--radius-md)', padding: 20, 
                 border: '1px solid var(--border)', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', right: -20, bottom: -20, fontSize: '6rem', color: 'var(--text-primary)', opacity: 0.03, pointerEvents: 'none' }}><i className="fas fa-bed"></i></div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{w.ward_name}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom: 16 }}>{w.ward_type}</div>
                
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginBottom: 8, fontWeight: 600 }}>
                  <span>{w.occupied_beds} / {w.total_beds}</span>
                  <strong style={{ color: w.occupancy_percent >= 90 ? 'var(--danger)' : 'var(--text-primary)' }}>
                    <AnimatedCounter value={w.occupancy_percent} />%
                  </strong>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{
                    width: 0, animation: `fillBarWard${w.ward_id} 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                    background: w.occupancy_percent >= 90 ? 'var(--danger)' : w.occupancy_percent >= 70 ? 'var(--warning)' : 'var(--accent-primary)',
                  }}>
                     <style>{`@keyframes fillBarWard${w.ward_id} { to { width: ${w.occupancy_percent}% } }`}</style>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
