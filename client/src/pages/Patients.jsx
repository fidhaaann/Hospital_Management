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
    <Layout pageTitle={<><i className="fas fa-user-injured" style={{ color:'var(--accent)', marginRight:8 }} />Patients</>}>
      <div className="page-header">
        <h2 style={{ fontWeight:700, fontSize:'1.15rem' }}>
          <span className="text-muted" style={{ fontWeight:400, fontSize:'0.85rem' }}>Showing: {filteredPatients.length} / {patients.length} records</span>
        </h2>
        {canEdit && <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus" />Add Patient</button>}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <input
            className="form-control"
            placeholder="Search by name, phone, ward, or patient ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="Outpatient">Outpatient</option>
            <option value="Admitted">Admitted</option>
            <option value="Discharged">Discharged</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-wrap"><div className="spinner"/></div> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>Name</th><th>Age/Gender</th><th>Phone</th><th>Blood</th><th>Ward</th><th>Admission</th><th>Status</th>{(canEdit||canDel) && <th>Actions</th>}</tr></thead>
              <tbody>
                {filteredPatients.length ? filteredPatients.map(p => (
                  <tr key={p.patient_id}>
                    <td className="text-muted font-mono" style={{ fontSize:'0.75rem' }}>#{p.patient_id}</td>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.age} / {p.gender}</td>
                    <td>{p.phone}</td>
                    <td>{p.blood_group ? <span className="badge" style={{ background:'#fee2e2', color:'#991b1b' }}>{p.blood_group}</span> : '—'}</td>
                    <td>{p.ward_name || '—'}</td>
                    <td style={{ fontSize:'0.8rem' }}>{p.admission_date ? new Date(p.admission_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td><span className={`badge badge-${p.status?.toLowerCase()}`}>{p.status}</span></td>
                    {(canEdit||canDel) && (
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          {canEdit && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(p)} title="Edit"><i className="fas fa-edit"/></button>}
                          {canDel  && <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteId(p.patient_id)} title="Delete"><i className="fas fa-trash"/></button>}
                        </div>
                      </td>
                    )}
                  </tr>
                )) : <tr><td colSpan={9}><div className="empty-state"><i className="fas fa-user-injured" />No patients match the filters.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-user-injured" style={{ color:'var(--primary-mid)', marginRight:8 }} />{editId ? 'Edit Patient' : 'Add New Patient'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={closeModal}><i className="fas fa-xmark"/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="row row-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-control" required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Patient full name" />
                  </div>
                  <div className="row" style={{ gridTemplateColumns:'1fr 1fr', gap:12 }}>
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
                    <label className="form-label">Phone *</label>
                    <input className="form-control" required value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
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
                  <label className="form-label">Address</label>
                  <textarea className="form-control" rows={2} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} />
                </div>
                <div className="row row-3">
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
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                      {['Outpatient','Admitted','Discharged'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ward</label>
                    <select className="form-select" value={form.ward_id} onChange={e=>setForm(f=>({...f,ward_id:e.target.value}))}>
                      <option value="">No ward</option>
                      {wards.map(w=><option key={w.ward_id} value={w.ward_id}>{w.ward_name} ({w.available_beds} beds)</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}}/>Saving…</> : <><i className="fas fa-save"/>{editId?'Update':'Add Patient'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && <ConfirmDialog message="Delete this patient? This cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </Layout>
  );
}
