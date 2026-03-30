import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../api';

const EMPTY = { role: 'receptionist', full_name: '', phone: '', email: '', department: '' };

export default function Users({ toast }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const load = async () => {
    try { const r = await api.get('/users'); setUsers(r.data); }
    catch (e) { toast?.(e.response?.data?.error || 'Failed to load', 'danger'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY);
    setModal(true);
  };

  const openEdit = user => {
    if (user.role === 'admin') return;
    setEditId(user.user_id);
    setForm({ full_name: user.full_name, role: user.role, phone: '', email: '', department: '' });
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditId(null);
    setForm(EMPTY);
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/users/${editId}`, form);
        toast?.('User updated!', 'success');
      } else {
        const r = await api.post('/users', form);
        setCreatedCreds({
          full_name: r.data.full_name,
          role: r.data.role,
          username: r.data.username,
          password: r.data.password,
        });
        if (r.data.role === 'doctor' && r.data.doctor_profile_created) {
          toast?.('Doctor profile auto-generated in Doctors partition.', 'success');
        } else {
          toast?.('Network account provisioned. Export credentials.', 'success');
        }
      }
      closeModal();
      load();
    } catch (e) { toast?.(e.response?.data?.error || 'Network error encountered', 'danger'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget.user_id}`);
      toast?.('User access revoked.', 'success');
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast?.(e.response?.data?.error || 'Failed to revoke access', 'danger');
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.trim().toLowerCase();
    const matchText = !q
      || String(u.username).toLowerCase().includes(q)
      || String(u.full_name).toLowerCase().includes(q)
      || String(u.user_id).includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchText && matchRole;
  });

  return (
    <Layout pageTitle={<><i className="fas fa-network-wired" style={{ color: 'var(--accent-primary)', marginRight: 12 }} />Network & Roles</>}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h2 style={{ fontWeight:400, fontSize:'1.4rem', fontFamily: 'var(--font-display)' }}>
          <span className="text-secondary" style={{ fontFamily: 'var(--font-mono)', fontSize:'0.9rem', marginLeft: 16 }}>Authorized: <strong>{filteredUsers.length}</strong> / {users.length} profiles</span>
        </h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="fas fa-plus" /> Provision Identity
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 200px', gap: 16, padding: '16px 20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
             <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                <input
                  className="form-control"
                  style={{ paddingLeft: 46 }}
                  placeholder="Query identity by username, name, or UID filter..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
             <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
               <option value="all">All Group Policies</option>
               <option value="admin">Administrators</option>
               <option value="doctor">Medical Officers</option>
               <option value="receptionist">Front Desk Staff</option>
             </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-wrap"><div className="spinner" /></div> : (
          <div className="tbl-wrap" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
            <table style={{ margin: 0 }}>
              <thead><tr><th style={{ background: 'transparent' }}>UID</th><th style={{ background: 'transparent' }}>System Identity</th><th style={{ background: 'transparent' }}>Given Name</th><th style={{ background: 'transparent' }}>Policy Group</th><th style={{ background: 'transparent' }}>Registered</th><th style={{ background: 'transparent', textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {filteredUsers.length ? filteredUsers.map(u => (
                  <tr key={u.user_id}>
                    <td className="text-muted font-mono" style={{ fontSize: '0.85rem' }}>UID-{String(u.user_id).padStart(4, '0')}</td>
                    <td><code style={{ background: 'var(--surface-hover)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: u.role === 'admin' ? 'var(--danger)' : 'var(--accent-primary)', border: '1px solid var(--border)' }}>{u.username}</code></td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name}</td>
                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                    <td className="text-secondary font-mono" style={{ fontSize: '0.85rem' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', {day:'2-digit', month: 'short', year:'numeric'}) : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {u.role === 'admin' ? (
                        <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 500, paddingRight: 8 }}><i className="fas fa-lock" style={{marginRight:6}}/>Protected</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn-icon" onClick={() => openEdit(u)} title="Modify Role/Access"><i className="fas fa-edit" /></button>
                          <button className="btn-icon" style={{color: 'var(--danger)'}} onClick={() => setDeleteTarget(u)} title="Revoke Rights"><i className="fas fa-trash" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                )) : <tr><td colSpan={6}><div className="empty-state"><i className="fas fa-users-slash" />No provisioned users match parameters.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ 
            height: '100vh', maxHeight: '100vh', margin: 0, borderRadius: 0, maxWidth: 460,
            display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <i className="fas fa-id-card" style={{ color: 'var(--accent-primary)' }} /> 
                 {editId ? 'Modify Access Rights' : 'Provision System Identity'}
              </h3>
              <button className="btn-icon" onClick={closeModal}><i className="fas fa-xmark" /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="form-group">
                  <label className="form-label">Full Name of Assignee *</label>
                  <input className="form-control" required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="e.g. Dr. John Smith" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Access Policy Group *</label>
                  <select className="form-select" required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {['doctor', 'receptionist'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                
                <div className="page-header" style={{ marginTop: 24, marginBottom: 16 }}>
                   <h2 style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}><i className="fas fa-address-book" style={{ fontSize: '1rem', color: 'var(--text-muted)' }} /> Contact Vector (Optional)</h2>
                </div>
                
                <div className="row row-2">
                  <div className="form-group">
                    <label className="form-label">Internal Direct</label>
                    <input
                      className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Ext. 402"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Comms Address</label>
                    <input
                      type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@medicore.net"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Department / Routing</label>
                  <input
                    className="form-control" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Cardiology, Front Desk"
                  />
                </div>
                
                {!editId && <div className="alert alert-info" style={{ marginTop: 24, padding: 16, fontSize: '0.85rem' }}>
                    <i className="fas fa-fingerprint" style={{ fontSize: '1.2rem'}}/>
                    <div style={{ flex: 1 }}>Login identifiers and hashed credentials are algorithmically generated upon commit. Note: You will be presented the temporal password on the next screen.</div>
                </div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Abort</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> Propagating...</> : <><i className="fas fa-satellite-dish" /> {editId ? 'Commit Changes' : 'Execute Provisioning'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {createdCreds && (
        <div className="modal-overlay" onClick={() => setCreatedCreds(null)}>
          <div className="modal" style={{ maxWidth: 440, padding: 32, borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 64, height: 64, background: 'rgba(0,196,140,0.1)', color: 'var(--accent-secondary)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: 16 }}>
                    <i className="fas fa-check"></i>
                </div>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0 }}>Provisioning Validated</h3>
                <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: 4 }}>System identity registered successfully</p>
            </div>
            
            <div style={{ background: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', padding: 24, border: '1px solid var(--border)', marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, max-content) 1fr', gap: '12px 16px', fontSize: '0.9rem' }}>
                <span className="text-secondary">Identity Linkage:</span> <strong style={{ color: 'var(--text-primary)' }}>{createdCreds.full_name}</strong>
                <span className="text-secondary">System Policy:</span> <span className={`badge badge-${createdCreds.role}`} style={{ display: 'inline-block', width: 'fit-content' }}>{createdCreds.role}</span>
                 <div style={{ gridColumn: '1/-1', height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <span className="text-secondary">Login Identifier:</span> <code style={{ background: 'var(--surface)', padding: '4px 8px', borderRadius: 4, color: 'var(--accent-primary)', border: '1px solid var(--border)' }}>{createdCreds.username}</code>
                <span className="text-secondary">Access Key:</span> <code className="font-mono" style={{ background: 'var(--surface)', padding: '4px 8px', borderRadius: 4, border: '1px dashed var(--warning)', color: 'var(--text-primary)' }}>{createdCreds.password}</code>
              </div>
            </div>
            
            <div className="alert alert-warning" style={{ fontSize: '0.8rem', padding: 12, marginBottom: 24 }}>
                <i className="fas fa-triangle-exclamation" style={{ margin: '2px 8px 0 0' }} />
                Capture this access key immediately. It will not be revealed again across the network once dismissed.
            </div>
            
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => setCreatedCreds(null)}>
               Acknowledge & Dismiss
            </button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Revoke Network Clearance"
          message={`Are you positive you wish to execute a permanent wipe on system identity '${deleteTarget.username}' (${deleteTarget.full_name})? This severs all logical connections immediately.`}
          confirmText="Confirm Purge"
          confirmIcon="fa-trash"
          confirmClass="btn-danger"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </Layout>
  );
}
