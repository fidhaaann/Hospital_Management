import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const EMPTY = { patient_id:'', doctor_id:'', appointment_date:'', appointment_time:'', reason:'' };

export default function Appointments({ toast }) {
  const { user } = useAuth();
  const [appts, setAppts]       = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    try {
      const [ar, pr, dr] = await Promise.all([
        api.get('/appointments'),
        api.get('/patients'),
        api.get('/doctors'),
      ]);
      setAppts(ar.data); setPatients(pr.data); setDoctors(dr.data);
    } catch (e) { toast?.(e.response?.data?.error || 'Failed to load', 'danger'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/appointments', form);
      toast?.('Appointment scheduled!', 'success');
      setModal(false); setForm(EMPTY); load();
    } catch (e) { toast?.(e.response?.data?.error || 'Failed to schedule', 'danger'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast?.('Status updated.', 'success'); load();
    } catch (e) { toast?.(e.response?.data?.error || 'Failed', 'danger'); }
  };

  const canAdd = ['admin','receptionist'].includes(user?.role);
  const filteredAppts = appts.filter(a => {
    const q = search.trim().toLowerCase();
    const matchText = !q
      || String(a.patient_name || '').toLowerCase().includes(q)
      || String(a.doctor_name || '').toLowerCase().includes(q)
      || String(a.reason || '').toLowerCase().includes(q)
      || String(a.appointment_id).includes(q);
    const matchStatus = statusFilter === 'all' || String(a.status) === statusFilter;
    return matchText && matchStatus;
  });

  return (
    <Layout pageTitle={<><i className="fas fa-calendar-check" style={{color:'var(--accent-primary)',marginRight:12}}/>Appointments</>}>
      <div className="page-header">
        <h2 style={{ fontWeight:400, fontSize:'1.4rem', fontFamily: 'var(--font-display)' }}>
          <span className="text-secondary" style={{ fontFamily: 'var(--font-mono)', fontSize:'0.9rem', marginLeft: 16 }}>Showing: <strong>{filteredAppts.length}</strong> / {appts.length}</span>
        </h2>
        {canAdd && <button className="btn btn-primary" onClick={()=>{setForm(EMPTY);setModal(true);}}><i className="fas fa-plus"/> Schedule Request</button>}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 200px', gap: 16, padding: '16px 20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
             <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                <input
                  className="form-control"
                  style={{ paddingLeft: 46 }}
                  placeholder="Search by patient, doctor, reason, or appointment ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
             <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
               <option value="all">All Status</option>
               <option value="Scheduled">Scheduled</option>
               <option value="Completed">Completed</option>
               <option value="Cancelled">Cancelled</option>
             </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-wrap"><div className="spinner"/></div> : (
          <div className="tbl-wrap" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
            <table style={{ margin: 0 }}>
              <thead><tr><th>#ID</th><th>Patient Name</th><th>Assigned Doctor</th><th>Agenda Date</th><th>Time Slot</th><th>Reason for Visit</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredAppts.length ? filteredAppts.map(a => (
                  <tr key={a.appointment_id}>
                    <td className="text-muted font-mono" style={{fontSize:'0.85rem'}}>#{String(a.appointment_id).padStart(4, '0')}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.patient_name}</td>
                    <td style={{ fontWeight: 500 }}>{a.doctor_name ? `Dr. ${a.doctor_name.replace('Dr. ', '')}` : '—'}</td>
                    <td className="font-mono" style={{fontSize:'0.85rem'}}>{a.appointment_date ? new Date(a.appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td><span className="font-mono" style={{background:'var(--surface-hover)',padding:'4px 10px',borderRadius:'var(--radius-sm)',fontSize:'0.85rem', color: 'var(--accent-primary)', border: '1px solid var(--border)'}}>{a.appointment_time_fmt || a.appointment_time}</span></td>
                    <td style={{fontSize:'0.85rem',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap', color:'var(--text-secondary)'}}>{a.reason || '—'}</td>
                    <td><span className={`badge badge-${a.status?.toLowerCase()}`}>{a.status}</span></td>
                    <td>
                      {a.status === 'Scheduled' ? (
                        <div style={{display:'flex',gap:8}}>
                          <button className="btn-icon" style={{ background: 'rgba(0, 196, 140, 0.1)', color: 'var(--accent-secondary)' }} onClick={()=>updateStatus(a.appointment_id,'Completed')} title="Mark Completed"><i className="fas fa-check"/></button>
                          <button className="btn-icon" style={{ background: 'rgba(255, 71, 87, 0.1)', color: 'var(--danger)' }} onClick={()=>updateStatus(a.appointment_id,'Cancelled')} title="Cancel Appointment"><i className="fas fa-xmark"/></button>
                        </div>
                      ) : <span className="text-muted" style={{ fontSize: '0.8rem' }}>Closed</span>}
                    </td>
                  </tr>
                )) : <tr><td colSpan={8}><div className="empty-state"><i className="fas fa-calendar-times"/>No appointments match the filters.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ 
            height: '100vh', maxHeight: '100vh', margin: 0, borderRadius: 0, maxWidth: 500,
            display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className="fas fa-calendar-plus" style={{color:'var(--accent-primary)'}}/> Schedule Session
              </h3>
              <button className="btn-icon" onClick={()=>setModal(false)}><i className="fas fa-xmark"/></button>
            </div>
            
            <form onSubmit={handleSave} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="alert alert-info" style={{marginBottom:24, padding: 16 }}>
                  <i className="fas fa-shield-alt" style={{ marginTop: 2, fontSize: '1.1rem' }}/>
                  <div style={{ flex: 1, fontSize: '0.85rem' }}><strong>Conflict Detection Active:</strong> The MediCore engine automatically prevents double-booking for the specified timeslot.</div>
                </div>
                
                <div className="form-group"><label className="form-label">Patient Selection *</label>
                  <select className="form-select" required value={form.patient_id} onChange={e=>setForm(f=>({...f,patient_id:e.target.value}))}>
                    <option value="">Select patient…</option>
                    {patients.map(p=><option key={p.patient_id} value={p.patient_id}>{p.name} (ID: {String(p.patient_id).padStart(4, '0')})</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Assigned Medical Officer *</label>
                  <select className="form-select" required value={form.doctor_id} onChange={e=>setForm(f=>({...f,doctor_id:e.target.value}))}>
                    <option value="">Select doctor…</option>
                    {doctors.filter(d=>d.available).map(d=><option key={d.doctor_id} value={d.doctor_id}>{d.name} — {d.specialization}</option>)}
                  </select>
                </div>
                
                <div className="row row-2">
                  <div className="form-group"><label className="form-label">Consultation Date *</label>
                    <input type="date" className="form-control" required value={form.appointment_date} onChange={e=>setForm(f=>({...f,appointment_date:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Consultation Time *</label>
                    <input type="time" className="form-control" required value={form.appointment_time} onChange={e=>setForm(f=>({...f,appointment_time:e.target.value}))}/></div>
                </div>
                
                <div className="form-group"><label className="form-label">Primary Reason / Symptoms</label>
                  <textarea className="form-control" rows={3} placeholder="Please brief the symptoms..." value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}/>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> Scheduling...</> : <><i className="fas fa-calendar-check"/> Confirm Schedule</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
