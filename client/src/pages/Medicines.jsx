import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const EMPTY = { medicine_name:'', stock_quantity:'', minimum_level:'10', price:'', unit:'tablets' };

export default function Medicines({ toast }) {
  const { user } = useAuth();
  const [meds, setMeds]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const load = async () => {
    try { const r = await api.get('/medicines'); setMeds(r.data); }
    catch (e) { toast?.(e.response?.data?.error || 'Failed', 'danger'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd  = ()  => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = m  => { setForm({ ...m }); setEditId(m.medicine_id); setModal(true); };
  const closeModal = () => { setModal(false); setEditId(null); };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) { await api.put(`/medicines/${editId}`, form); toast?.('Medicine updated!', 'success'); }
      else         { await api.post('/medicines', form);          toast?.('Medicine added!', 'success'); }
      closeModal(); load();
    } catch (e) { toast?.(e.response?.data?.error || 'Save failed', 'danger'); }
    finally { setSaving(false); }
  };

  const isAdmin = user?.role === 'admin';
  const filteredMeds = meds.filter(m => {
    const q = search.trim().toLowerCase();
    const low = m.stock_quantity < m.minimum_level;
    const matchText = !q
      || String(m.medicine_name || '').toLowerCase().includes(q)
      || String(m.unit || '').toLowerCase().includes(q)
      || String(m.medicine_id).includes(q);
    const matchStock = stockFilter === 'all'
      || (stockFilter === 'low' && low)
      || (stockFilter === 'ok' && !low);
    return matchText && matchStock;
  });

  return (
    <Layout pageTitle={<><i className="fas fa-pills" style={{color:'var(--accent-primary)',marginRight:12}}/>Pharmacy Inventory</>}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h2 style={{ fontWeight:400, fontSize:'1.4rem', fontFamily: 'var(--font-display)' }}>
          <span className="text-secondary" style={{ fontFamily: 'var(--font-mono)', fontSize:'0.9rem', marginLeft: 16 }}>Showing: <strong>{filteredMeds.length}</strong> / {meds.length} items</span>
        </h2>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd}><i className="fas fa-plus"/> Add Stock Item</button>}
      </div>
      
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 200px', gap: 16, padding: '16px 20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
             <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                <input
                  className="form-control"
                  style={{ paddingLeft: 46 }}
                  placeholder="Search by medication name, unit form, or ID code..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
             <select className="form-select" value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
               <option value="all">All Inventory</option>
               <option value="low">Low Stock Alerts</option>
               <option value="ok">Adequate Stock</option>
             </select>
          </div>
        </div>
      </div>
      
      <div className="card">
        {loading ? <div className="spinner-wrap"><div className="spinner"/></div> : (
          <div className="tbl-wrap" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
            <table style={{ margin: 0 }}>
              <thead><tr><th style={{ background: 'transparent' }}>Item ID</th><th style={{ background: 'transparent' }}>Medication Name</th><th style={{ background: 'transparent' }}>Form / Unit</th><th style={{ background: 'transparent' }}>List Price</th><th style={{ background: 'transparent' }}>Stock Avail.</th><th style={{ background: 'transparent' }}>Min Threshold</th><th style={{ background: 'transparent' }}>Status</th>{isAdmin&&<th style={{ background: 'transparent', textAlign: 'right' }}>Manage</th>}</tr></thead>
              <tbody>
                {filteredMeds.length ? filteredMeds.map(m => {
                  const low = m.stock_quantity < m.minimum_level;
                  return (
                    <tr key={m.medicine_id} className={low ? 'row-warning' : ''} style={low ? { background: 'rgba(245, 158, 11, 0.04)' } : {}}>
                      <td className="text-muted font-mono" style={{fontSize:'0.85rem'}}>MED-{String(m.medicine_id).padStart(4, '0')}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.medicine_name}</td>
                      <td className="text-secondary">{m.unit}</td>
                      <td className="font-mono text-secondary">₹{m.price}</td>
                      <td><strong className="font-mono" style={{ color: low ? 'var(--danger)' : 'var(--text-primary)' }}>{m.stock_quantity}</strong></td>
                      <td className="text-secondary font-mono">{m.minimum_level}</td>
                      <td>
                        <span className={`badge ${low ? 'badge-low' : 'badge-ok'}`} style={{ border: low ? '1px solid rgba(255, 71, 87, 0.2)' : '1px solid rgba(0, 196, 140, 0.2)' }}>
                          {low ? <><i className="fas fa-exclamation-circle" style={{marginRight: 4}}/> Low Stock</> : <><i className="fas fa-check-circle" style={{marginRight: 4}}/> Optimal</>}
                        </span>
                      </td>
                      {isAdmin && <td style={{ textAlign: 'right' }}><button className="btn-icon" onClick={()=>openEdit(m)}><i className="fas fa-edit"/></button></td>}
                    </tr>
                  );
                }) : <tr><td colSpan={8}><div className="empty-state"><i className="fas fa-pills"/>No pharmacy records match the criteria.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ 
            height: '100vh', maxHeight: '100vh', margin: 0, borderRadius: 0, maxWidth: 500,
            display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className="fas fa-pills" style={{color:'var(--accent-primary)'}}/> 
                {editId?'Update Medication Details':'Register New Medication'}
              </h3>
              <button className="btn-icon" onClick={closeModal}><i className="fas fa-xmark"/></button>
            </div>
            
            <form onSubmit={handleSave} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="form-group"><label className="form-label">Medication Name / Trade Name *</label>
                  <input className="form-control" required value={form.medicine_name} onChange={e=>setForm(f=>({...f,medicine_name:e.target.value}))} placeholder="e.g. Paracetamol 500mg" /></div>
                
                <div className="page-header" style={{ marginTop: 24, marginBottom: 16 }}>
                  <h2 style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}><i className="fas fa-boxes-stacked" style={{ fontSize: '1rem', color: 'var(--text-muted)' }} /> Inventory Levels</h2>
                </div>

                <div className="row row-2">
                  <div className="form-group"><label className="form-label">Initial Stock Qty *</label>
                    <input type="number" className="form-control" required min="0" value={form.stock_quantity} onChange={e=>setForm(f=>({...f,stock_quantity:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Min Alert Threshold *</label>
                    <input type="number" className="form-control" required min="0" value={form.minimum_level} onChange={e=>setForm(f=>({...f,minimum_level:e.target.value}))}/></div>
                </div>
                
                <div className="page-header" style={{ marginTop: 24, marginBottom: 16 }}>
                  <h2 style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}><i className="fas fa-tag" style={{ fontSize: '1rem', color: 'var(--text-muted)' }} /> Pricing & Details</h2>
                </div>

                <div className="row row-2">
                  <div className="form-group"><label className="form-label">Unit Price (₹) *</label>
                    <input type="number" className="form-control" required min="0" step="0.01" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Packaging / Form</label>
                    <input className="form-control" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} placeholder="e.g. tablet, syrup bottle…"/></div>
                </div>
                
                {!editId && <div className="alert alert-info" style={{ marginTop: 16, fontSize: '0.85rem' }}>
                    <i className="fas fa-info-circle"/> 
                    <div>New medical supplies are immediately available for prescription orders.</div>
                </div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving?<><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> Saving...</>:<><i className="fas fa-save"/> {editId?'Update Record':'Add to Inventory'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
