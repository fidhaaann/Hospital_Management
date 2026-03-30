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
    <Layout pageTitle={<><i className="fas fa-pills" style={{color:'var(--accent)',marginRight:8}}/>Pharmacy Stock</>}>
      <div className="page-header">
        <span className="text-muted" style={{fontSize:'0.85rem'}}>Showing: <strong>{filteredMeds.length}</strong> / {meds.length} medicines</span>
        {isAdmin && <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus"/>Add Medicine</button>}
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <input
            className="form-control"
            placeholder="Search by medicine name, unit, or ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="form-select" value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
            <option value="all">All stock levels</option>
            <option value="low">Low stock only</option>
            <option value="ok">In stock only</option>
          </select>
        </div>
      </div>
      <div className="card">
        {loading ? <div className="spinner-wrap"><div className="spinner"/></div> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>Medicine</th><th>Unit</th><th>Price</th><th>Stock</th><th>Min Level</th><th>Status</th>{isAdmin&&<th>Actions</th>}</tr></thead>
              <tbody>
                {filteredMeds.length ? filteredMeds.map(m => {
                  const low = m.stock_quantity < m.minimum_level;
                  return (
                    <tr key={m.medicine_id} style={low ? {background:'#fffbeb'} : {}}>
                      <td className="text-muted font-mono" style={{fontSize:'0.75rem'}}>#{m.medicine_id}</td>
                      <td><strong>{m.medicine_name}</strong></td>
                      <td>{m.unit}</td>
                      <td>₹{m.price}</td>
                      <td><strong style={low ? {color:'var(--danger)'} : {}}>{m.stock_quantity}</strong></td>
                      <td>{m.minimum_level}</td>
                      <td><span className={`badge badge-${low?'low':'ok'}`}>{low ? '⚠ Low Stock' : '✓ OK'}</span></td>
                      {isAdmin && <td><button className="btn btn-ghost btn-icon btn-sm" onClick={()=>openEdit(m)}><i className="fas fa-edit"/></button></td>}
                    </tr>
                  );
                }) : <tr><td colSpan={8}><div className="empty-state"><i className="fas fa-pills"/>No medicines match the filters.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-pills" style={{color:'var(--primary-mid)',marginRight:8}}/>{editId?'Edit Medicine':'Add Medicine'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={closeModal}><i className="fas fa-xmark"/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Medicine Name *</label>
                  <input className="form-control" required value={form.medicine_name} onChange={e=>setForm(f=>({...f,medicine_name:e.target.value}))}/></div>
                <div className="row row-2">
                  <div className="form-group"><label className="form-label">Stock Quantity *</label>
                    <input type="number" className="form-control" required min="0" value={form.stock_quantity} onChange={e=>setForm(f=>({...f,stock_quantity:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Minimum Level *</label>
                    <input type="number" className="form-control" required min="0" value={form.minimum_level} onChange={e=>setForm(f=>({...f,minimum_level:e.target.value}))}/></div>
                </div>
                <div className="row row-2">
                  <div className="form-group"><label className="form-label">Price (₹) *</label>
                    <input type="number" className="form-control" required min="0" step="0.01" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Unit</label>
                    <input className="form-control" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} placeholder="tablets, capsules…"/></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving?'Saving…':<><i className="fas fa-save"/>{editId?'Update':'Add Medicine'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
