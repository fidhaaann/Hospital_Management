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
    const duration = 1200; // ms
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


export default function Analytics({ toast }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctorSearch, setDoctorSearch] = useState('');

  useEffect(() => {
    api.get('/analytics')
      .then(r => setData(r.data))
      .catch(e => toast?.(e.response?.data?.error || 'Failed to load analytics', 'danger'))
      .finally(() => setLoading(false));
  }, [toast]);

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
    <Layout pageTitle={<><i className="fas fa-chart-pie" style={{ color: 'var(--accent-primary)', marginRight: 12 }} /><span style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em', fontSize: '1.6rem' }}>System Analytics &amp; Reports</span></>}>

      {/* Revenue summary */}
      <div style={{
        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
        borderRadius: 'var(--radius-lg)', padding: '24px 32px', color: '#fff', marginBottom: 32,
        boxShadow: '0 20px 40px rgba(0, 196, 140, 0.15)', position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative background element */}
        <div style={{ position: 'absolute', right: -40, top: -60, fontSize: '14rem', opacity: 0.08, pointerEvents: 'none' }}>
           <i className="fas fa-chart-line"></i>
        </div>
        
        <div style={{ letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fas fa-wallet" style={{ fontSize: '1.1rem', color: '#fff' }} />
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: '#fff', letterSpacing: '0.15em' }}>Financial Overview Dashboard</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {[
            ['Net Revenue',      Math.round(d.revenue?.total_revenue      || 0), '#ffffff'],
            ['Capital Collected',Math.round(d.revenue?.collected_revenue  || 0), '#a7f3d0'],
            ['Pending Capital',  Math.round(d.revenue?.pending_revenue    || 0), '#fde68a'],
            ['Avg. Ticket Size', Math.round(d.revenue?.avg_bill_amount    || 0), '#bfdbfe'],
          ].map(([lbl, val, col], idx) => (
            <div key={lbl}>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lbl}</div>
              <div className="font-mono" style={{ fontSize: '2.2rem', fontWeight: 700, color: '#ffffff', lineHeight: 1, letterSpacing: '-0.02em', textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                 <AnimatedCounter prefix="₹" value={val} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row row-2" style={{ marginBottom: 32 }}>
        {/* Monthly admissions */}
        <div className="card" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <><i className="fas fa-chart-area" style={{ color: 'var(--accent-primary)' }} /> <span style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', fontSize: '1.1rem' }}>Volume Metrics</span></>
            <span style={{ marginLeft: 12, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, background: 'var(--surface-hover)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>GROUP BY + COUNT(*)</span>
          </div>
          <div className="card-body">
            {d.monthly?.length ? d.monthly.map((m, idx) => (
              <div key={m.month} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{m.month_name}</span>
                  <strong className="font-mono" style={{ color: 'var(--text-primary)' }}><AnimatedCounter value={m.count} /></strong>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: 0, animation: `fillBar${idx} 1s ease-out ${0.2 + idx * 0.1}s forwards` }}>
                     <style>{`@keyframes fillBar${idx} { to { width: ${(m.count / maxMonth) * 100}% } }`}</style>
                  </div>
                </div>
              </div>
            )) : <div className="empty-state"><i className="fas fa-calendar-times"/>No ingestion data available for this temporal range.</div>}
          </div>
        </div>

        {/* Top doctors */}
        <div className="card" style={{ animationDelay: '0.2s', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <><i className="fas fa-trophy" style={{ color: 'var(--warning)' }} /> <span style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', fontSize: '1.1rem' }}>Provider Performance</span></>
            <span style={{ marginLeft: 12, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, background: 'var(--surface-hover)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>LEFT JOIN + COUNT + ORDER BY</span>
          </div>
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <div className="form-group" style={{ margin: 0, position: 'relative' }}>
               <i className="fas fa-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
               <input
                 className="form-control" style={{ paddingLeft: 46 }}
                 placeholder="Filter providers by name or specialization scope..."
                 value={doctorSearch} onChange={e => setDoctorSearch(e.target.value)}
               />
            </div>
          </div>
          <div className="tbl-wrap" style={{ margin: 0, border: 'none', boxShadow: 'none', flex: 1 }}>
            <table style={{ margin: 0 }}>
              <thead><tr><th style={{ background: 'transparent' }}>Provider Identity</th><th style={{ background: 'transparent' }}>Medical Scope</th><th style={{ background: 'transparent', textAlign: 'right' }}>Volume</th></tr></thead>
              <tbody>
                {filteredTopDoctors.length ? filteredTopDoctors.map((doc, i) => (
                  <tr key={i}>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`}</strong></td>
                    <td className="text-secondary">{doc.specialization}</td>
                    <td style={{ textAlign: 'right' }}>
                       <span className="badge" style={{ background: 'rgba(0,196,140,0.1)', color: 'var(--accent-secondary)', border: '1px solid rgba(0,196,140,0.2)', padding: '4px 10px' }}><AnimatedCounter value={doc.total} /></span>
                    </td>
                  </tr>
                )) : <tr><td colSpan={3} className="text-muted" style={{ textAlign: 'center', padding: 32 }}>No statistical data matches query</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="row row-3" style={{ marginBottom: 32 }}>
        {/* Patient status breakdown */}
        <div className="card" style={{ animationDelay: '0.3s' }}>
          <div className="card-header"><><i className="fas fa-users-viewfinder" style={{ color: 'var(--info)' }} /> <span style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', fontSize: '1.1rem' }}>Patient State</span></></div>
          <div className="card-body">
            {d.status_breakdown?.map(s => (
              <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '12px 16px', background: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span className={`badge badge-${s.status?.toLowerCase()}`}>{s.status}</span>
                <strong className="font-mono" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}><AnimatedCounter value={s.count} /></strong>
              </div>
            ))}
          </div>
        </div>

        {/* Payment breakdown */}
        <div className="card" style={{ animationDelay: '0.4s' }}>
          <div className="card-header">
             <><i className="fas fa-file-invoice-dollar" style={{ color: 'var(--accent-secondary)' }} /> <span style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', fontSize: '1.1rem' }}>Invoice State</span></>
             <span style={{ marginLeft: 12, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, background: 'var(--surface-hover)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>SUM + GROUP BY</span>
          </div>
          <div className="card-body">
            {d.payment_breakdown?.map(p => (
              <div key={p.payment_status} style={{ marginBottom: 16, borderBottom: '1px dashed var(--border)', paddingBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                  <span className={`badge badge-${p.payment_status?.toLowerCase()}`}>{p.payment_status}</span>
                  <span className="text-secondary" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{p.count} Invoices</span>
                </div>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: p.payment_status === 'Paid' ? 'var(--accent-primary)' : p.payment_status === 'Pending' ? 'var(--warning)' : 'var(--info)', letterSpacing: '-0.02em' }}>
                  <AnimatedCounter prefix="₹" value={Math.round(p.total || 0)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ward occupancy from VIEW */}
        <div className="card" style={{ animationDelay: '0.5s' }}>
          <div className="card-header">
            <><i className="fas fa-bed-pulse" style={{ color: 'var(--danger)' }} /> <span style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', fontSize: '1.1rem' }}>Facility Load</span></>
            <span style={{ marginLeft: 12, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, background: 'var(--surface-hover)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>VIEW logic</span>
          </div>
          <div className="card-body">
            {d.ward_occ?.map(w => (
              <div key={w.ward_id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6, fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{w.ward_name}</span>
                  <strong className="font-mono" style={{ color: w.occupancy_percent >= 90 ? 'var(--danger)' : 'var(--text-primary)' }}>
                    <AnimatedCounter value={w.occupancy_percent} />%
                  </strong>
                </div>
                <div className="progress">
                   <div className="progress-bar" style={{
                    width: 0, animation: `fillBarWard${w.ward_id} 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                    background: w.occupancy_percent>=90?'var(--danger)':w.occupancy_percent>=70?'var(--warning)':'var(--info)',
                  }}>
                    <style>{`@keyframes fillBarWard${w.ward_id} { to { width: ${w.occupancy_percent}% } }`}</style>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </Layout>
  );
}
