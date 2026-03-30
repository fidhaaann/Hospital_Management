import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const EMPTY = { name:'', age:'', gender:'', phone:'', address:'', blood_group:'', admission_date:'', discharge_date:'', ward_id:'', status:'Outpatient' };

export default function Patients({ toast }) {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [wards, setWards]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    try {
      const [pr, wr] = await Promise.all([api.get('/patients'), api.get('/wards')]);
      setPatients(pr.data);
      setWards(wr.data);
    } catch (e) { toast?.(e.response?.data?.error || 'Failed to load', 'danger'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = ()  => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (p) => { setForm({ ...p, ward_id: p.ward_id || '', discharge_date: p.discharge_date || '', blood_group: p.blood_group || '' }); setEditId(p.patient_id); setModal(true); };
  const closeModal = () => { setModal(false); setForm(EMPTY); setEditId(null); };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/patients/${editId}`, form);
        toast?.('Patient updated successfully!', 'success');
      } else {
        await api.post('/patients', form);
        toast?.('Patient added successfully!', 'success');
      }
      closeModal();
      load();
    } catch (e) { toast?.(e.response?.data?.error || 'Save failed', 'danger'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/patients/${deleteId}`);
      toast?.('Patient deleted.', 'success');
      setDeleteId(null);
      load();
    } catch (e) { toast?.(e.response?.data?.error || 'Delete failed', 'danger'); }
  };

  const canEdit = ['admin','receptionist'].includes(user?.role);
  const canDel  = user?.role === 'admin';
  const filteredPatients = patients.filter(p => {
    const q = search.trim().toLowerCase();
    const matchText = !q
      || String(p.name).toLowerCase().includes(q)
      || String(p.phone || '').toLowerCase().includes(q)
      || String(p.ward_name || '').toLowerCase().includes(q)
      || String(p.patient_id).includes(q);
    const matchStatus = statusFilter === 'all' || String(p.status) === statusFilter;
    return matchText && matchStatus;
  });

  return (
    <Layout pageTitle={<><i className="fas fa-user-injured" style={{ color:'var(--accent-primary)', marginRight:12 }} />Patient Registry</>}>
      <div className="page-header">
        <h2 style={{ fontWeight:400, fontSize:'1.4rem', fontFamily: 'var(--font-display)' }}>
          <span className="text-secondary" style={{ fontFamily: 'var(--font-mono)', fontSize:'0.9rem', marginLeft: 16 }}>{filteredPatients.length} / {patients.length} records</span>
        </h2>
        {canEdit && <button className="btn btn-primary" onClick={openAdd}><i className="fas fa-plus" /> New Patient</button>}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 200px', gap: 16, padding: '16px 20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
             <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                <input
                  className="form-control"
                  style={{ paddingLeft: 46 }}
                  placeholder="Search by name, phone, ward, or patient ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
             <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
               <option value="all">All Status</option>
               <option value="Outpatient">Outpatient</option>
               <option value="Admitted">Admitted</option>
               <option value="Discharged">Discharged</option>
             </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-wrap"><div className="spinner"/></div> : (
          <div className="tbl-wrap" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
            <table style={{ margin: 0 }}>
              <thead><tr><th>#ID</th><th>Patient Name</th><th>Age/Gender</th><th>Contact</th><th>Blood</th><th>Ward</th><th>Admission</th><th>Status</th>{(canEdit||canDel) && <th style={{ textAlign: 'right' }}>Actions</th>}</tr></thead>
              <tbody>
                {filteredPatients.length ? filteredPatients.map((p, idx) => (
                  <tr key={p.patient_id}>
                    <td className="text-muted font-mono" style={{ fontSize:'0.85rem' }}>#{String(p.patient_id).padStart(4, '0')}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.age} / {p.gender.charAt(0)}</td>
                    <td className="font-mono">{p.phone}</td>
                    <td>{p.blood_group ? <span className="badge" style={{ background:'rgba(255, 71, 87, 0.1)', color:'var(--danger)', border: '1px solid rgba(255, 71, 87, 0.2)' }}>{p.blood_group}</span> : '—'}</td>
                    <td className="text-secondary">{p.ward_name || '—'}</td>
                    <td className="font-mono" style={{ fontSize:'0.85rem' }}>{p.admission_date ? new Date(p.admission_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td><span className={`badge badge-${p.status?.toLowerCase()}`}>{p.status}</span></td>
                    {(canEdit||canDel) && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display:'flex', gap:6, justifyContent: 'flex-end' }}>
                          {canEdit && <button className="btn-icon" onClick={() => openEdit(p)} title="Edit"><i className="fas fa-edit"/></button>}
                          {canDel  && <button className="btn-icon" onClick={() => setDeleteId(p.patient_id)} title="Delete" style={{ color: 'var(--danger)' }}><i className="fas fa-trash"/></button>}
                        </div>
                      </td>
                    )}
                  </tr>
                )) : <tr><td colSpan={9}><div className="empty-state"><i className="fas fa-clipboard-check" />No patients match the current filters.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer-style Modal for Edit/Add */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ 
            height: '100vh', maxHeight: '100vh', margin: 0, borderRadius: 0, maxWidth: 540,
            display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className="fas fa-user-injured" style={{ color:'var(--accent-primary)' }} />
                {editId ? 'Edit Patient Record' : 'Register New Patient'}
              </h3>
              <button className="btn-icon" onClick={closeModal}><i className="fas fa-xmark"/></button>
            </div>
            <form onSubmit={handleSave} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="row row-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-control" required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Patient full name" />
                  </div>
                  <div className="row" style={{ gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div className="form-group">
                      <label className="form-label">Age *</label>
                      <input type="number" className="form-control" required min="1" max="119" value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender *</label>
                      <select className="form-select" required value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))}>
                        <option value="">Select</option>
                        {['Male','Female','Other'].map(g=><option key={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="row row-2">
                  <div className="form-group">
                    <label className="form-label">Phone Contact *</label>
                    <input className="form-control" required value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="e.g. +91 9876543210" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select className="form-select" value={form.blood_group} onChange={e=>setForm(f=>({...f,blood_group:e.target.value}))}>
                      <option value="">Unknown</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b=><option key={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Residential Address</label>
                  <textarea className="form-control" rows={3} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Full address" />
                </div>
                
                <div className="page-header" style={{ marginTop: 32, marginBottom: 16 }}>
                  <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}><i className="fas fa-hospital" style={{ fontSize: '1rem' }} /> Admission Details</h2>
                </div>

                <div className="row row-2">
                  <div className="form-group">
                    <label className="form-label">Admission Date *</label>
                    <input type="date" className="form-control" required value={form.admission_date} onChange={e=>setForm(f=>({...f,admission_date:e.target.value}))} />
                  </div>
                  {form.status === 'Discharged' && (
                    <div className="form-group">
                      <label className="form-label">Discharge Date</label>
                      <input type="date" className="form-control" value={form.discharge_date} onChange={e=>setForm(f=>({...f,discharge_date:e.target.value}))} />
                    </div>
                  )}
                </div>
                <div className="row row-2">
                  <div className="form-group">
                    <label className="form-label">Current Status</label>
                    <select className="form-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                      {['Outpatient','Admitted','Discharged'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assigned Ward</label>
                    <select className="form-select" value={form.ward_id} onChange={e=>setForm(f=>({...f,ward_id:e.target.value}))} disabled={form.status === 'Outpatient' || form.status === 'Discharged'}>
                      <option value="">No ward assigned</option>
                      {wards.map(w=><option key={w.ward_id} value={w.ward_id}>{w.ward_name} ({w.available_beds} beds available)</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> Saving...</> : <><i className="fas fa-save"/> {editId?'Update Record':'Save Patient'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && <ConfirmDialog message="Delete this patient record? This action cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </Layout>
  );
}
