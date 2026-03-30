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
    <Layout pageTitle={<><i className="fas fa-calendar-check" style={{color:'var(--accent)',marginRight:8}}/>Appointments</>}>
      <div className="page-header">
        <span className="text-muted" style={{fontSize:'0.85rem'}}>Showing: <strong>{filteredAppts.length}</strong> / {appts.length}</span>
        {canAdd && <button className="btn btn-primary btn-sm" onClick={()=>{setForm(EMPTY);setModal(true);}}><i className="fas fa-plus"/>Schedule</button>}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <input
            className="form-control"
            placeholder="Search by patient, doctor, reason, or appointment ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-wrap"><div className="spinner"/></div> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredAppts.length ? filteredAppts.map(a => (
                  <tr key={a.appointment_id}>
                    <td className="text-muted font-mono" style={{fontSize:'0.75rem'}}>#{a.appointment_id}</td>
                    <td><strong>{a.patient_name}</strong></td>
                    <td>{a.doctor_name}</td>
                    <td style={{fontSize:'0.82rem'}}>{a.appointment_date ? new Date(a.appointment_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={{fontSize:'0.82rem'}}><span style={{fontFamily:'var(--font-mono)',background:'var(--surface-2)',padding:'2px 8px',borderRadius:5,fontSize:'0.78rem'}}>{a.appointment_time_fmt || a.appointment_time}</span></td>
                    <td style={{fontSize:'0.8rem',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.reason || '—'}</td>
                    <td><span className={`badge badge-${a.status?.toLowerCase()}`}>{a.status}</span></td>
                    <td>
                      {a.status === 'Scheduled' && (
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn btn-success btn-sm" onClick={()=>updateStatus(a.appointment_id,'Completed')} title="Mark Complete"><i className="fas fa-check"/></button>
                          <button className="btn btn-danger btn-sm" onClick={()=>updateStatus(a.appointment_id,'Cancelled')} title="Cancel"><i className="fas fa-xmark"/></button>
                        </div>
                      )}
                    </td>
                  </tr>
                )) : <tr><td colSpan={8}><div className="empty-state"><i className="fas fa-calendar-check"/>No appointments match the filters.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-calendar-plus" style={{color:'var(--primary-mid)',marginRight:8}}/>Schedule Appointment</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setModal(false)}><i className="fas fa-xmark"/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="alert alert-info" style={{marginBottom:16}}>
                  <i className="fas fa-shield-alt"/><span><strong>Conflict Detection Active:</strong> A DB UNIQUE constraint on (doctor_id, date, time) prevents double-booking.</span>
                </div>
                <div className="form-group"><label className="form-label">Patient *</label>
                  <select className="form-select" required value={form.patient_id} onChange={e=>setForm(f=>({...f,patient_id:e.target.value}))}>
                    <option value="">Select patient…</option>
                    {patients.map(p=><option key={p.patient_id} value={p.patient_id}>{p.name}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">Doctor *</label>
                  <select className="form-select" required value={form.doctor_id} onChange={e=>setForm(f=>({...f,doctor_id:e.target.value}))}>
                    <option value="">Select doctor…</option>
                    {doctors.filter(d=>d.available).map(d=><option key={d.doctor_id} value={d.doctor_id}>{d.name} — {d.specialization}</option>)}
                  </select></div>
                <div className="row row-2">
                  <div className="form-group"><label className="form-label">Date *</label>
                    <input type="date" className="form-control" required value={form.appointment_date} onChange={e=>setForm(f=>({...f,appointment_date:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Time *</label>
                    <input type="time" className="form-control" required value={form.appointment_time} onChange={e=>setForm(f=>({...f,appointment_time:e.target.value}))}/></div>
                </div>
                <div className="form-group"><label className="form-label">Reason</label>
                  <textarea className="form-control" rows={2} placeholder="Reason for visit…" value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}/></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving?'Scheduling…':<><i className="fas fa-calendar-check"/>Schedule</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
