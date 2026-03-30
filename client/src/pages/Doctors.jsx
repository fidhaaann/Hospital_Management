import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const EMPTY = { name:'', specialization:'', phone:'', email:'', consultation_fee:'', available: true };

export default function Doctors({ toast }) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState('all');

  const load = async () => {
    try { const r = await api.get('/doctors'); setDoctors(r.data); }
    catch (e) { toast?.(e.response?.data?.error || 'Failed to load', 'danger'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = d => { setForm({ ...d }); setEditId(d.doctor_id); setModal(true); };
  const closeModal = () => { setModal(false); setEditId(null); };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) { await api.put(`/doctors/${editId}`, form); toast?.('Doctor updated!', 'success'); }
      else         { await api.post('/doctors', form);          toast?.('Doctor added!', 'success'); }
      closeModal(); load();
    } catch (e) { toast?.(e.response?.data?.error || 'Save failed', 'danger'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/doctors/${deleteId}`); toast?.('Doctor deleted.', 'success'); setDeleteId(null); load(); }
    catch (e) { toast?.(e.response?.data?.error || 'Delete failed', 'danger'); }
  };

  const isAdmin = user?.role === 'admin';
  const filteredDoctors = doctors.filter(d => {
    const q = search.trim().toLowerCase();
    const matchText = !q
      || String(d.name).toLowerCase().includes(q)
      || String(d.specialization).toLowerCase().includes(q)
      || String(d.phone || '').toLowerCase().includes(q);
    const matchAvail = availability === 'all'
      || (availability === 'available' && !!d.available)
      || (availability === 'busy' && !d.available);
    return matchText && matchAvail;
  });

  return (
    <Layout pageTitle={<><i className="fas fa-user-md" style={{color:'var(--accent)',marginRight:8}}/>Doctors</>}>
      <div className="page-header">
        <h2><span className="text-muted" style={{fontWeight:400,fontSize:'0.85rem'}}>Showing: {filteredDoctors.length} / {doctors.length}</span></h2>
        {isAdmin && <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus"/>Add Doctor</button>}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <input
            className="form-control"
            placeholder="Search by doctor name, specialization, or phone"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="form-select" value={availability} onChange={e => setAvailability(e.target.value)}>
            <option value="all">All availability</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
          </select>
        </div>
      </div>

      {loading ? <div className="spinner-wrap"><div className="spinner"/></div> : (
        <div className="row row-3">
          {filteredDoctors.length ? filteredDoctors.map(d => (
            <div key={d.doctor_id} className="card">
              <div className="card-body">
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                  <div style={{ width:48,height:48,borderRadius:'50%',background:'var(--accent-dim)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',color:'var(--primary-mid)' }}>
                    <i className="fas fa-user-md"/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600 }}>{d.name}</div>
                    <div className="text-muted" style={{ fontSize:'0.78rem' }}>{d.specialization}</div>
                  </div>
                  <span className={`badge ${d.available ? 'badge-completed' : 'badge-discharged'}`}>
                    {d.available ? 'Available' : 'Busy'}
                  </span>
                </div>
                <div style={{ fontSize:'0.82rem', lineHeight:2 }}>
                  <div><i className="fas fa-phone" style={{color:'var(--text-muted)',marginRight:8,width:14}}/>{d.phone}</div>
                  <div><i className="fas fa-envelope" style={{color:'var(--text-muted)',marginRight:8,width:14}}/>{d.email || '—'}</div>
                  <div><i className="fas fa-indian-rupee-sign" style={{color:'var(--text-muted)',marginRight:8,width:14}}/>Consult: <strong>₹{d.consultation_fee}</strong></div>
                </div>
                {isAdmin && (
                  <div style={{ display:'flex', gap:8, marginTop:14 }}>
                    <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => openEdit(d)}><i className="fas fa-edit"/>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(d.doctor_id)}><i className="fas fa-trash"/></button>
                  </div>
                )}
              </div>
            </div>
          )) : <div className="card" style={{ gridColumn:'1/-1' }}><div className="empty-state"><i className="fas fa-user-md"/>No doctors match the filters.</div></div>}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-user-md" style={{color:'var(--primary-mid)',marginRight:8}}/>{editId?'Edit Doctor':'Add Doctor'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={closeModal}><i className="fas fa-xmark"/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Full Name *</label>
                  <input className="form-control" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
                <div className="row row-2">
                  <div className="form-group"><label className="form-label">Specialization *</label>
                    <input className="form-control" required value={form.specialization} onChange={e=>setForm(f=>({...f,specialization:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Consultation Fee (₹) *</label>
                    <input type="number" className="form-control" required min="1" step="0.01" value={form.consultation_fee} onChange={e=>setForm(f=>({...f,consultation_fee:e.target.value}))}/></div>
                </div>
                <div className="row row-2">
                  <div className="form-group"><label className="form-label">Phone *</label>
                    <input className="form-control" required value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
                </div>
                {editId && (
                  <div className="form-group" style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <input type="checkbox" id="avail" checked={!!form.available} onChange={e=>setForm(f=>({...f,available:e.target.checked}))} style={{ width:16,height:16 }}/>
                    <label htmlFor="avail" className="form-label" style={{ margin:0 }}>Available for appointments</label>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Saving…' : <><i className="fas fa-save"/>{editId?'Update':'Add Doctor'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteId && <ConfirmDialog message="Delete this doctor?" onConfirm={handleDelete} onCancel={()=>setDeleteId(null)}/>}
    </Layout>
  );
}
