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
    <Layout pageTitle={<><i className="fas fa-user-md" style={{color:'var(--accent-primary)',marginRight:12}}/>Medical Staff</>}>
      <div className="page-header">
        <h2 style={{ fontWeight:400, fontSize:'1.4rem', fontFamily: 'var(--font-display)' }}>
          <span className="text-secondary" style={{ fontFamily: 'var(--font-mono)', fontSize:'0.9rem', marginLeft: 16 }}>{filteredDoctors.length} / {doctors.length} records</span>
        </h2>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd}><i className="fas fa-plus"/>Add Doctor</button>}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 200px', gap: 16, padding: '16px 20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
             <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                <input
                  className="form-control"
                  style={{ paddingLeft: 46 }}
                  placeholder="Search by doctor name, specialization, or phone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
             <select className="form-select" value={availability} onChange={e => setAvailability(e.target.value)}>
               <option value="all">All Availability</option>
               <option value="available">Available Now</option>
               <option value="busy">Busy / On Call</option>
             </select>
          </div>
        </div>
      </div>

      {loading ? <div className="spinner-wrap"><div className="spinner"/></div> : (
        <div className="row row-3">
          {filteredDoctors.length ? filteredDoctors.map((d, i) => (
            <div key={d.doctor_id} className="card" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="card-body">
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                  <div style={{ width:56,height:56,borderRadius:'50%',background:'var(--surface-hover)', border: '1px solid var(--border)', display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',color:'var(--accent-primary)' }}>
                    <i className="fas fa-user-md"/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{d.name.startsWith('Dr.') ? d.name : `Dr. ${d.name}`}</div>
                    <div className="text-secondary" style={{ fontSize:'0.85rem' }}>{d.specialization}</div>
                  </div>
                  <span className={`badge ${d.available ? 'badge-completed' : 'badge-discharged'}`}>
                    {d.available ? 'Available' : 'Busy'}
                  </span>
                </div>
                
                <div style={{ fontSize:'0.85rem', lineHeight:2.2, color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><i className="fas fa-phone" style={{color:'var(--text-muted)',marginRight:12,width:16,textAlign:'center'}}/> <span className="font-mono">{d.phone}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center' }}><i className="fas fa-envelope" style={{color:'var(--text-muted)',marginRight:12,width:16,textAlign:'center'}}/> {d.email || '—'}</div>
                  <div style={{ display: 'flex', alignItems: 'center' }}><i className="fas fa-indian-rupee-sign" style={{color:'var(--text-muted)',marginRight:12,width:16,textAlign:'center'}}/> Consult Fee: <strong style={{ color: 'var(--text-primary)', marginLeft: 8 }} className="font-mono">₹{d.consultation_fee}</strong></div>
                </div>
                
                {isAdmin && (
                  <div style={{ display:'flex', gap:10, marginTop:24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <button className="btn btn-ghost" style={{ flex:1, padding: '8px 12px' }} onClick={() => openEdit(d)}><i className="fas fa-edit"/> Edit Profile</button>
                    <button className="btn btn-danger btn-icon" style={{ borderRadius: 'var(--radius-md)' }} onClick={() => setDeleteId(d.doctor_id)}><i className="fas fa-trash"/></button>
                  </div>
                )}
              </div>
            </div>
          )) : <div className="card" style={{ gridColumn:'1/-1' }}><div className="empty-state"><i className="fas fa-user-md"/>No doctors match the filters.</div></div>}
        </div>
      )}

      {/* Drawer-style Modal for Edit/Add */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ 
            height: '100vh', maxHeight: '100vh', margin: 0, borderRadius: 0, maxWidth: 500,
            display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <i className="fas fa-user-md" style={{color:'var(--accent-primary)'}}/>
                 {editId?'Edit Doctor Profile':'New Doctor Registration'}
              </h3>
              <button className="btn-icon" onClick={closeModal}><i className="fas fa-xmark"/></button>
            </div>
            
            <form onSubmit={handleSave} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="form-group"><label className="form-label">Full Name *</label>
                  <input className="form-control" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Dr. John Smith"/></div>
                <div className="row row-2">
                  <div className="form-group"><label className="form-label">Specialization *</label>
                    <input className="form-control" required value={form.specialization} onChange={e=>setForm(f=>({...f,specialization:e.target.value}))} placeholder="e.g. Cardiology"/></div>
                  <div className="form-group"><label className="form-label">Consultation Fee (₹) *</label>
                    <input type="number" className="form-control" required min="1" step="0.01" value={form.consultation_fee} onChange={e=>setForm(f=>({...f,consultation_fee:e.target.value}))}/></div>
                </div>
                <div className="row row-2">
                  <div className="form-group"><label className="form-label">Phone Contact *</label>
                    <input className="form-control" required value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="e.g. +91 9876543210"/></div>
                  <div className="form-group"><label className="form-label">Email Address</label>
                    <input type="email" className="form-control" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="doctor@example.com"/></div>
                </div>
                {editId && (
                  <div className="form-group" style={{ display:'flex', alignItems:'center', gap:12, padding: '16px 20px', background: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <input type="checkbox" id="avail" checked={!!form.available} onChange={e=>setForm(f=>({...f,available:e.target.checked}))} />
                    <label htmlFor="avail" className="form-label" style={{ margin:0, cursor: 'pointer' }}>Available for Immediate Appointments</label>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> Saving...</> : <><i className="fas fa-save"/> {editId?'Update Profile':'Register Doctor'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteId && <ConfirmDialog message="Permanently remove this doctor from the registry? This action cannot be undone." onConfirm={handleDelete} onCancel={()=>setDeleteId(null)}/>}
    </Layout>
  );
}
