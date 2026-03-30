import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const EMPTY = { patient_id:'', doctor_id:'', diagnosis:'', notes:'' };

export default function Prescriptions({ toast }) {
  const { user } = useAuth();
  const [list, setList]         = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const [pr, pa, dr] = await Promise.all([api.get('/prescriptions'), api.get('/patients'), api.get('/doctors')]);
      setList(pr.data); setPatients(pa.data); setDoctors(dr.data);
    } catch (e) { toast?.(e.response?.data?.error || 'Failed to load', 'danger'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/prescriptions', form);
      toast?.('Prescription added!', 'success');
      setModal(false); setForm(EMPTY); load();
    } catch (e) { toast?.(e.response?.data?.error || 'Failed', 'danger'); }
    finally { setSaving(false); }
  };

  const canAdd = ['admin','doctor'].includes(user?.role);
  const filteredList = list.filter(p => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return String(p.patient_name || '').toLowerCase().includes(q)
      || String(p.doctor_name || '').toLowerCase().includes(q)
      || String(p.diagnosis || '').toLowerCase().includes(q)
      || String(p.prescription_id).includes(q);
  });

  return (
    <Layout pageTitle={<><i className="fas fa-file-prescription" style={{color:'var(--accent-primary)',marginRight:12}}/>Clinical Prescriptions</>}>
      <div className="page-header">
        <h2 style={{ fontWeight:400, fontSize:'1.4rem', fontFamily: 'var(--font-display)' }}>
          <span className="text-secondary" style={{ fontFamily: 'var(--font-mono)', fontSize:'0.9rem', marginLeft: 16 }}>Showing: <strong>{filteredList.length}</strong> / {list.length}</span>
        </h2>
        {canAdd && <button className="btn btn-primary" onClick={()=>{setForm(EMPTY);setModal(true);}}><i className="fas fa-plus"/> Issue Prescription</button>}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
             <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                <input
                  className="form-control"
                  style={{ paddingLeft: 46 }}
                  placeholder="Search by patient name, doctor, diagnosis, or Rx ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-wrap"><div className="spinner"/></div> : (
          <div className="tbl-wrap" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
            <table style={{ margin: 0 }}>
              <thead><tr><th style={{ background: 'transparent' }}>Rx ID</th><th style={{ background: 'transparent' }}>Patient</th><th style={{ background: 'transparent' }}>Doctor</th><th style={{ background: 'transparent' }}>Diagnosis</th><th style={{ background: 'transparent' }}>Treatment Notes</th><th style={{ background: 'transparent', width: 140 }}>Date Issued</th></tr></thead>
              <tbody>
                {filteredList.length ? filteredList.map(p => (
                  <tr key={p.prescription_id}>
                    <td className="text-muted font-mono" style={{fontSize:'0.85rem'}}>#{String(p.prescription_id).padStart(4, '0')}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.patient_name}</td>
                    <td style={{ fontWeight: 500 }}>{p.doctor_name ? `Dr. ${p.doctor_name.replace('Dr. ', '')}` : '—'}</td>
                    <td style={{ maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: 'var(--text-secondary)' }}>
                       <span style={{ background:'rgba(0, 87, 255, 0.06)', padding:'4px 8px', borderRadius:'4px', color:'var(--accent-primary)', fontSize: '0.85rem' }}>{p.diagnosis}</span>
                    </td>
                    <td className="text-secondary" style={{fontSize:'0.85rem',maxWidth:250,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.notes || '—'}</td>
                    <td className="font-mono" style={{fontSize:'0.85rem'}}>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</td>
                  </tr>
                )) : <tr><td colSpan={6}><div className="empty-state"><i className="fas fa-file-prescription"/>No prescription records match the filters.</div></td></tr>}
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
                <i className="fas fa-file-medical" style={{color:'var(--accent-primary)'}}/> Issue Prescription
              </h3>
              <button className="btn-icon" onClick={()=>setModal(false)}><i className="fas fa-xmark"/></button>
            </div>
            
            <form onSubmit={handleSave} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="form-group"><label className="form-label">Patient Selection *</label>
                  <select className="form-select" required value={form.patient_id} onChange={e=>setForm(f=>({...f,patient_id:e.target.value}))}>
                    <option value="">Patient lookup…</option>
                    {patients.map(p=><option key={p.patient_id} value={p.patient_id}>{p.name} (ID: {p.patient_id})</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Attending Doctor *</label>
                  <select className="form-select" required value={form.doctor_id} onChange={e=>setForm(f=>({...f,doctor_id:e.target.value}))}>
                    <option value="">Select practitioner…</option>
                    {doctors.map(d=><option key={d.doctor_id} value={d.doctor_id}>{d.name} — {d.specialization}</option>)}
                  </select>
                </div>
                
                <div className="page-header" style={{ marginTop: 32, marginBottom: 16 }}>
                  <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}><i className="fas fa-stethoscope" style={{ fontSize: '1rem' }} /> Clinical Findings</h2>
                </div>
                
                <div className="form-group"><label className="form-label">Diagnosis *</label>
                  <textarea className="form-control" rows={3} required placeholder="Enter primary and secondary diagnosis codes/descriptions..." value={form.diagnosis} onChange={e=>setForm(f=>({...f,diagnosis:e.target.value}))}/>
                </div>
                <div className="form-group"><label className="form-label">Treatment Plan / Notes</label>
                  <textarea className="form-control" rows={4} placeholder="Prescribed medications, dosage, dietary instructions, follow-up..." value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> Saving...</> : <><i className="fas fa-file-signature"/> Sign & Issue</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
