import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const EMPTY = { ward_name: '', ward_type: 'General', total_beds: '', charge_per_day: '' };

export default function Wards({ toast }) {
  const { user } = useAuth();
  const [wards, setWards]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin';

  const load = async () => {
    try {
      const r = await api.get('/wards');
      setWards(r.data);
    } catch (e) {
      toast?.(e.response?.data?.error || 'Failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const closeModal = () => {
    setModal(false);
    setForm(EMPTY);
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/wards', form);
      toast?.('Ward created successfully!', 'success');
      closeModal();
      load();
    } catch (err) {
      toast?.(err.response?.data?.error || 'Failed to create ward', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const filteredWards = wards.filter(w => {
    const q = search.trim().toLowerCase();
    const matchText = !q
      || String(w.ward_name || '').toLowerCase().includes(q)
      || String(w.ward_type || '').toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || String(w.ward_type) === typeFilter;
    return matchText && matchType;
  });

  return (
    <Layout pageTitle={<><i className="fas fa-bed" style={{color:'var(--accent)',marginRight:8}}/>Ward Management</>}>
      <div className="page-header">
        <span className="text-muted" style={{ fontSize: '0.85rem' }}>Showing: <strong>{filteredWards.length}</strong> / {wards.length} wards</span>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>
            <i className="fas fa-plus" />Add Ward
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <input
            className="form-control"
            placeholder="Search by ward name or ward type"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All ward types</option>
            {['General', 'ICU', 'Emergency', 'Pediatric', 'Maternity'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      {loading ? <div className="spinner-wrap"><div className="spinner"/></div> : (
        <div className="row row-3">
          {filteredWards.length ? filteredWards.map(w => (
            <div key={w.ward_id} className="card">
              <div className="card-body">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                  <div>
                    <h6 style={{fontWeight:700,marginBottom:4}}>{w.ward_name}</h6>
                    <span className="badge badge-outpatient">{w.ward_type}</span>
                  </div>
                  <span className={`badge ${w.occupancy_percent>=90?'badge-low':w.occupancy_percent>=70?'badge-scheduled':'badge-ok'}`}>
                    {w.occupancy_percent}% full
                  </span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',textAlign:'center',marginBottom:14}}>
                  {[['Total Beds',w.total_beds,'var(--primary-mid)'],['Available',w.available_beds,'#15803d'],['Occupied',w.occupied_beds,'var(--danger)']].map(([lbl,val,col])=>(
                    <div key={lbl}>
                      <div style={{fontSize:'1.6rem',fontWeight:700,color:col,lineHeight:1}}>{val}</div>
                      <div style={{fontSize:'0.7rem',color:'var(--text-muted)',marginTop:2}}>{lbl}</div>
                    </div>
                  ))}
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{
                    width:`${w.occupancy_percent}%`,
                    background: w.occupancy_percent>=90?'var(--danger)':w.occupancy_percent>=70?'var(--warning)':undefined,
                  }}/>
                </div>
              </div>
            </div>
          )) : <div className="card" style={{gridColumn:'1/-1'}}><div className="empty-state"><i className="fas fa-bed"/>No wards match the filters.</div></div>}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-bed" style={{ color: 'var(--primary-mid)', marginRight: 8 }} />Add Ward</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={closeModal}><i className="fas fa-xmark" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Ward Name *</label>
                  <input
                    className="form-control"
                    required
                    value={form.ward_name}
                    onChange={e => setForm(f => ({ ...f, ward_name: e.target.value }))}
                    placeholder="e.g. Ward A"
                  />
                </div>
                <div className="row row-2">
                  <div className="form-group">
                    <label className="form-label">Ward Type *</label>
                    <select className="form-select" required value={form.ward_type} onChange={e => setForm(f => ({ ...f, ward_type: e.target.value }))}>
                      {['General', 'ICU', 'Emergency', 'Pediatric', 'Maternity'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Beds *</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      min="1"
                      value={form.total_beds}
                      onChange={e => setForm(f => ({ ...f, total_beds: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Charge Per Day (₹) *</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    min="0"
                    step="0.01"
                    value={form.charge_per_day}
                    onChange={e => setForm(f => ({ ...f, charge_per_day: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Saving…' : <><i className="fas fa-save" />Create Ward</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
