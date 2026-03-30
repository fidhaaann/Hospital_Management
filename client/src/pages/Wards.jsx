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
      toast?.('Ward region created successfully!', 'success');
      closeModal();
      load();
    } catch (err) {
      toast?.(err.response?.data?.error || 'Failed to initialize ward', 'danger');
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
    <Layout pageTitle={<><i className="fas fa-bed-pulse" style={{color:'var(--accent-primary)',marginRight:12}}/>Ward Facilities</>}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h2 style={{ fontWeight:400, fontSize:'1.4rem', fontFamily: 'var(--font-display)' }}>
           <span className="text-secondary" style={{ fontFamily: 'var(--font-mono)', fontSize:'0.9rem', marginLeft: 16 }}>Overview: <strong>{filteredWards.length}</strong> / {wards.length} regions</span>
        </h2>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <i className="fas fa-plus" /> Add Facility
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 200px', gap: 16, padding: '16px 20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
             <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                <input
                  className="form-control"
                  style={{ paddingLeft: 46 }}
                  placeholder="Query by ward name or facility clearance..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
             <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
               <option value="all">All Disciplines</option>
               {['General', 'ICU', 'Emergency', 'Pediatric', 'Maternity'].map(t => <option key={t} value={t}>{t}</option>)}
             </select>
          </div>
        </div>
      </div>
      
      {loading ? <div className="spinner-wrap"><div className="spinner"/></div> : (
        <div className="row row-3">
          {filteredWards.length ? filteredWards.map((w, idx) => (
            <div key={w.ward_id} className="card" style={{ animationDelay: `${idx * 0.1}s`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -30, top: -20, fontSize: '8rem', color: 'var(--text-primary)', opacity: 0.02, pointerEvents: 'none' }}><i className="fas fa-hospital-user"></i></div>
              <div className="card-body">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24, borderBottom: '1px solid var(--border)', paddingBottom: 16}}>
                  <div>
                    <h6 style={{fontWeight:700, fontSize: '1.2rem', marginBottom:8, color: 'var(--text-primary)'}}>{w.ward_name}</h6>
                    <span className="badge badge-outpatient" style={{ background: 'var(--surface-hover)', color: 'var(--accent-secondary)' }}>{w.ward_type}</span>
                  </div>
                  <span className={`badge ${w.occupancy_percent>=90?'badge-low':w.occupancy_percent>=70?'badge-scheduled':'badge-ok'}`} style={{ border: '1px solid currentColor', background: 'transparent' }}>
                    {w.occupancy_percent}% <span className="text-secondary" style={{ marginLeft: 4 }}>Full</span>
                  </span>
                </div>
                
                <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)', gap: 12, textAlign:'center',marginBottom:16}}>
                  {[['Maximum',w.total_beds,'var(--text-secondary)'],['Available',w.available_beds,'var(--accent-primary)'],['Occupied',w.occupied_beds,'var(--danger)']].map(([lbl,val,col])=>(
                    <div key={lbl} style={{ background: 'var(--surface)', padding: '12px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div className="font-mono" style={{fontSize:'1.6rem',fontWeight:700,color:col,lineHeight:1.2}}>{val}</div>
                      <div style={{fontSize:'0.75rem',fontWeight:600,color:'var(--text-muted)',marginTop:6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>{lbl}</div>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                   <span className="text-secondary">Facility Traffic</span>
                   <strong style={{ color: w.occupancy_percent>=90?'var(--danger)':'var(--text-primary)' }}>{w.occupancy_percent}%</strong>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{
                    width:0, animation: `fillBar${w.ward_id} 1s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                    background: w.occupancy_percent>=90?'var(--danger)':w.occupancy_percent>=70?'var(--warning)':'var(--accent-primary)',
                  }}>
                    <style>{`@keyframes fillBar${w.ward_id} { to { width: ${w.occupancy_percent}% } }`}</style>
                  </div>
                </div>
              </div>
            </div>
          )) : <div className="card" style={{gridColumn:'1/-1'}}><div className="empty-state"><i className="fas fa-bed-pulse"/>No registered facilities match the filters.</div></div>}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={closeModal} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ 
            height: '100vh', maxHeight: '100vh', margin: 0, borderRadius: 0, maxWidth: 440,
            display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <i className="fas fa-bed" style={{ color: 'var(--accent-primary)' }} /> Configure Facility
              </h3>
              <button className="btn-icon" onClick={closeModal}><i className="fas fa-xmark" /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                
                <div className="page-header" style={{ marginTop: 16, marginBottom: 16 }}>
                   <h2 style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}><i className="fas fa-circle-info" style={{ fontSize: '1rem', color: 'var(--text-muted)' }} /> Baseline Configuration</h2>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Ward Designation *</label>
                  <input
                    className="form-control" required value={form.ward_name} onChange={e => setForm(f => ({ ...f, ward_name: e.target.value }))}
                    placeholder="e.g. Isolation Ward C"
                  />
                </div>
                
                <div className="row row-2">
                  <div className="form-group">
                    <label className="form-label">Operational Type *</label>
                    <select className="form-select" required value={form.ward_type} onChange={e => setForm(f => ({ ...f, ward_type: e.target.value }))}>
                      {['General', 'ICU', 'Emergency', 'Pediatric', 'Maternity'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Bed Capacity *</label>
                    <input
                      type="number" className="form-control font-mono" required min="1" value={form.total_beds} onChange={e => setForm(f => ({ ...f, total_beds: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Daily Tariff (₹) *</label>
                  <input
                    type="number" className="form-control font-mono" required min="0" step="0.01" value={form.charge_per_day} onChange={e => setForm(f => ({ ...f, charge_per_day: e.target.value }))}
                    placeholder="Base charge applied per overnight stay"
                  />
                </div>
                
                <div className="alert alert-info" style={{ marginTop: 24, padding: 16, fontSize: '0.85rem' }}>
                    <i className="fas fa-microchip" style={{ fontSize: '1.1rem' }}/> 
                    <div style={{ flex: 1 }}>Availability counters update automatically via MySQL DB Triggers connected to patient Admissions & Discharges.</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> Initializing...</> : <><i className="fas fa-server" /> Deploy Infrastructure</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
