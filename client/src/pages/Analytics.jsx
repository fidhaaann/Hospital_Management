import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';

export default function Analytics({ toast }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctorSearch, setDoctorSearch] = useState('');

  useEffect(() => {
    api.get('/analytics')
      .then(r => setData(r.data))
      .catch(e => toast?.(e.response?.data?.error || 'Failed to load analytics', 'danger'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout pageTitle="Analytics"><div className="spinner-wrap"><div className="spinner" /></div></Layout>
  );

  const d = data || {};
  const maxMonth = d.monthly?.length ? Math.max(...d.monthly.map(m => m.count), 1) : 1;
  const filteredTopDoctors = (d.top_doctors || []).filter(doc => {
    const q = doctorSearch.trim().toLowerCase();
    if (!q) return true;
    return String(doc.name || '').toLowerCase().includes(q)
      || String(doc.specialization || '').toLowerCase().includes(q);
  });

  return (
    <Layout pageTitle={<><i className="fas fa-chart-bar" style={{ color: 'var(--accent)', marginRight: 8 }} />Analytics &amp; Reports</>}>

      {/* Revenue summary */}
      <div style={{
        background: 'linear-gradient(135deg,#0f4c35,#1a6b4a)',
        borderRadius: 14, padding: '22px 28px', color: '#fff', marginBottom: 24,
      }}>
        <div style={{ fontSize: '0.7rem', opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
          Revenue Summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, textAlign: 'center' }}>
          {[
            ['Total Revenue',    `₹${Math.round(d.revenue?.total_revenue      || 0).toLocaleString()}`, '#fff'],
            ['Collected',        `₹${Math.round(d.revenue?.collected_revenue  || 0).toLocaleString()}`, 'var(--accent)'],
            ['Pending',          `₹${Math.round(d.revenue?.pending_revenue    || 0).toLocaleString()}`, '#fbbf24'],
            ['Avg Bill Amount',  `₹${Math.round(d.revenue?.avg_bill_amount    || 0).toLocaleString()}`, '#93c5fd'],
          ].map(([lbl, val, col]) => (
            <div key={lbl}>
              <div style={{ fontSize: '0.72rem', opacity: 0.7, marginBottom: 6 }}>{lbl}</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 700, color: col, lineHeight: 1 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="row row-2" style={{ marginBottom: 24 }}>
        {/* Monthly admissions — GROUP BY with COUNT */}
        <div className="card">
          <div className="card-header">
            <i className="fas fa-chart-bar" />Monthly Patient Admissions
            <span style={{ marginLeft: 8, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>GROUP BY + COUNT(*)</span>
          </div>
          <div className="card-body">
            {d.monthly?.length ? d.monthly.map(m => (
              <div key={m.month} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                  <span>{m.month_name}</span><strong>{m.count}</strong>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${(m.count / maxMonth) * 100}%` }} />
                </div>
              </div>
            )) : <p className="text-muted" style={{ fontSize: '0.85rem' }}>No admission data for this year.</p>}
          </div>
        </div>

        {/* Top doctors — LEFT JOIN + GROUP BY + COUNT */}
        <div className="card">
          <div className="card-header">
            <i className="fas fa-trophy" />Top Doctors by Appointments
            <span style={{ marginLeft: 8, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>LEFT JOIN + COUNT + ORDER BY</span>
          </div>
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <input
              className="form-control"
              placeholder="Filter doctors by name or specialization"
              value={doctorSearch}
              onChange={e => setDoctorSearch(e.target.value)}
            />
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Doctor</th><th>Specialization</th><th>Appointments</th></tr></thead>
              <tbody>
                {filteredTopDoctors.length ? filteredTopDoctors.map((doc, i) => (
                  <tr key={i}>
                    <td><strong>{doc.name}</strong></td>
                    <td className="text-muted">{doc.specialization}</td>
                    <td><span className="badge badge-outpatient">{doc.total}</span></td>
                  </tr>
                )) : <tr><td colSpan={3} className="text-muted" style={{ textAlign: 'center', padding: 20 }}>No data matches the filter</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="row row-3" style={{ marginBottom: 24 }}>
        {/* Patient status breakdown */}
        <div className="card">
          <div className="card-header"><i className="fas fa-users" />Patient Status Breakdown</div>
          <div className="card-body">
            {d.status_breakdown?.map(s => (
              <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className={`badge badge-${s.status?.toLowerCase()}`}>{s.status}</span>
                <strong style={{ fontSize: '1.1rem' }}>{s.count}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Payment breakdown — SUM + GROUP BY */}
        <div className="card">
          <div className="card-header"><i className="fas fa-credit-card" />Payment Breakdown</div>
          <div className="card-body">
            {d.payment_breakdown?.map(p => (
              <div key={p.payment_status} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className={`badge badge-${p.payment_status?.toLowerCase()}`}>{p.payment_status}</span>
                  <span style={{ fontSize: '0.85rem' }}>{p.count} bills</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-mid)' }}>
                  ₹{Math.round(p.total || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ward occupancy from VIEW */}
        <div className="card">
          <div className="card-header">
            <i className="fas fa-bed" />Ward Occupancy
            <span style={{ marginLeft: 8, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>VIEW: ward_occupancy</span>
          </div>
          <div className="card-body">
            {d.ward_occ?.map(w => (
              <div key={w.ward_id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                  <span>{w.ward_name}</span>
                  <strong style={{ color: w.occupancy_percent >= 90 ? 'var(--danger)' : 'var(--primary-mid)' }}>
                    {w.occupancy_percent}%
                  </strong>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{
                    width: `${w.occupancy_percent}%`,
                    background: w.occupancy_percent >= 90 ? 'var(--danger)' : w.occupancy_percent >= 70 ? 'var(--warning)' : undefined,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </Layout>
  );
}
