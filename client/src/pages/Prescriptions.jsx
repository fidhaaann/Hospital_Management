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
    <Layout pageTitle={<><i className="fas fa-file-medical" style={{color:'var(--accent)',marginRight:8}}/>Prescriptions</>}>
      <div className="page-header">
        <span className="text-muted" style={{fontSize:'0.85rem'}}>Showing: <strong>{filteredList.length}</strong> / {list.length}</span>
        {canAdd && <button className="btn btn-primary btn-sm" onClick={()=>{setForm(EMPTY);setModal(true);}}><i className="fas fa-plus"/>Add Prescription</button>}
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body">
          <input
            className="form-control"
            placeholder="Search by patient, doctor, diagnosis, or prescription ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="card">
        {loading ? <div className="spinner-wrap"><div className="spinner"/></div> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>Patient</th><th>Doctor</th><th>Diagnosis</th><th>Notes</th><th>Date</th></tr></thead>
              <tbody>
                {filteredList.length ? filteredList.map(p => (
                  <tr key={p.prescription_id}>
                    <td className="text-muted font-mono" style={{fontSize:'0.75rem'}}>#{p.prescription_id}</td>
                    <td><strong>{p.patient_name}</strong></td>
                    <td>{p.doctor_name}</td>
                    <td style={{maxWidth:200}}>{p.diagnosis}</td>
                    <td className="text-muted" style={{fontSize:'0.8rem',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.notes || '—'}</td>
                    <td style={{fontSize:'0.8rem'}}>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}</td>
                  </tr>
                )) : <tr><td colSpan={6}><div className="empty-state"><i className="fas fa-file-medical"/>No prescriptions match the filters.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-file-medical" style={{color:'var(--primary-mid)',marginRight:8}}/>Add Prescription</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setModal(false)}><i className="fas fa-xmark"/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Patient *</label>
                  <select className="form-select" required value={form.patient_id} onChange={e=>setForm(f=>({...f,patient_id:e.target.value}))}>
                    <option value="">Select patient…</option>
                    {patients.map(p=><option key={p.patient_id} value={p.patient_id}>{p.name}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">Doctor *</label>
                  <select className="form-select" required value={form.doctor_id} onChange={e=>setForm(f=>({...f,doctor_id:e.target.value}))}>
                    <option value="">Select doctor…</option>
                    {doctors.map(d=><option key={d.doctor_id} value={d.doctor_id}>{d.name}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">Diagnosis *</label>
                  <textarea className="form-control" rows={3} required placeholder="Enter diagnosis…" value={form.diagnosis} onChange={e=>setForm(f=>({...f,diagnosis:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Notes / Treatment Plan</label>
                  <textarea className="form-control" rows={3} placeholder="Medications, instructions…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving?'Saving…':<><i className="fas fa-save"/>Save Prescription</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
