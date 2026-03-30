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
          toast?.('Doctor account created and added to Doctors section.', 'success');
        } else {
          toast?.('User created. Share credentials securely.', 'success');
        }
      }
      closeModal();
      load();
    } catch (e) { toast?.(e.response?.data?.error || 'Failed to save user', 'danger'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget.user_id}`);
      toast?.('User deleted.', 'success');
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast?.(e.response?.data?.error || 'Failed to delete user', 'danger');
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
    <Layout pageTitle={<><i className="fas fa-users-cog" style={{ color: 'var(--accent)', marginRight: 8 }} />User Management</>}>
      <div className="page-header">
        <span className="text-muted" style={{ fontSize: '0.85rem' }}>Showing: <strong>{filteredUsers.length}</strong> / {users.length} users</span>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <i className="fas fa-plus" />Add User
        </button>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <input
            className="form-control"
            placeholder="Search by username, full name, or ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">All roles</option>
            <option value="admin">admin</option>
            <option value="doctor">doctor</option>
            <option value="receptionist">receptionist</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-wrap"><div className="spinner" /></div> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>Username</th><th>Full Name</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredUsers.length ? filteredUsers.map(u => (
                  <tr key={u.user_id}>
                    <td className="text-muted font-mono" style={{ fontSize: '0.75rem' }}>#{u.user_id}</td>
                    <td><code style={{ background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 5, fontSize: '0.82rem' }}>{u.username}</code></td>
                    <td><strong>{u.full_name}</strong></td>
                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}</td>
                    <td>
                      {u.role === 'admin' ? (
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>Protected</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}><i className="fas fa-edit" />Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(u)}><i className="fas fa-trash" />Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )) : <tr><td colSpan={6}><div className="empty-state"><i className="fas fa-users" />No users match the filters.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-user-plus" style={{ color: 'var(--primary-mid)', marginRight: 8 }} />{editId ? 'Edit User' : 'Create New User'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={closeModal}><i className="fas fa-xmark" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="e.g. Dr. John Smith" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select className="form-select" required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {['doctor', 'receptionist'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="row row-2">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      className="form-control"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="Contact number"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="name@hospital.com"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Department / Unit</label>
                  <input
                    className="form-control"
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    placeholder="e.g. Cardiology, Front Desk"
                  />
                </div>
                {!editId && <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>Username and password will be auto-generated.</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Saving…' : <><i className="fas fa-save" />{editId ? 'Update User' : 'Create User'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {createdCreds && (
        <div className="modal-overlay" onClick={() => setCreatedCreds(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-key" style={{ color: 'var(--warning)', marginRight: 8 }} />Generated Credentials</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setCreatedCreds(null)}><i className="fas fa-xmark" /></button>
            </div>
            <div className="modal-body" style={{ lineHeight: 1.9 }}>
              <div><strong>Name:</strong> {createdCreds.full_name}</div>
              <div><strong>Role:</strong> {createdCreds.role}</div>
              <div><strong>Username:</strong> <code>{createdCreds.username}</code></div>
              <div><strong>Password:</strong> <code>{createdCreds.password}</code></div>
              <p className="text-muted" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.8rem' }}>Share these credentials securely. This password is shown only now.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setCreatedCreds(null)}><i className="fas fa-check" />Done</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete User"
          message={`Delete account ${deleteTarget.username}? This action cannot be undone.`}
          confirmText="Delete"
          confirmIcon="fa-trash"
          confirmClass="btn-danger"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </Layout>
  );
}
