import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const EMPTY_FORM = { patient_id:'', consultation_fee:'0', lab_charge:'0', ward_charge:'0', medicines:[] };

export default function Bills({ toast }) {
  const { user } = useAuth();
  const [bills, setBills]         = useState([]);
  const [patients, setPatients]   = useState([]);
  const [medList, setMedList]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const load = async () => {
    try {
      const [br, pr, mr] = await Promise.all([api.get('/bills'), api.get('/patients'), api.get('/medicines')]);
      setBills(br.data); setPatients(pr.data); setMedList(mr.data);
    } catch (e) { toast?.(e.response?.data?.error || 'Failed to load', 'danger'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const addMedRow    = () => setForm(f => ({ ...f, medicines: [...f.medicines, { medicine_id:'', quantity:'' }] }));
  const removeMedRow = i  => setForm(f => ({ ...f, medicines: f.medicines.filter((_,idx)=>idx!==i) }));
  const updateMed    = (i, k, v) => setForm(f => ({ ...f, medicines: f.medicines.map((m,idx) => idx===i ? {...m,[k]:v} : m) }));

  const liveTotal = () => {
    let t = (parseFloat(form.consultation_fee)||0) + (parseFloat(form.lab_charge)||0) + (parseFloat(form.ward_charge)||0);
    form.medicines.forEach(m => {
      const med = medList.find(x=>String(x.medicine_id)===String(m.medicine_id));
      if (med && m.quantity) t += parseFloat(med.price) * parseInt(m.quantity);
    });
    return t;
  };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const r = await api.post('/bills', {
        patient_id: form.patient_id,
        consultation_fee: form.consultation_fee,
        lab_charge: form.lab_charge,
        ward_charge: form.ward_charge,
        medicines: form.medicines.filter(m=>m.medicine_id && m.quantity),
      });
      toast?.(r.data.message, 'success');
      setModal(false); setForm(EMPTY_FORM); load();
    } catch (e) { toast?.(e.response?.data?.error || 'Failed', 'danger'); }
    finally { setSaving(false); }
  };

  const updatePayment = async (bid, status) => {
    try { await api.patch(`/bills/${bid}/payment`, { status }); toast?.('Payment status updated.','success'); load(); }
    catch (e) { toast?.(e.response?.data?.error||'Failed','danger'); }
  };

  const canAct = ['admin','receptionist'].includes(user?.role);
  const filteredBills = bills.filter(b => {
    const q = search.trim().toLowerCase();
    const matchText = !q
      || String(b.patient_name || '').toLowerCase().includes(q)
      || String(b.bill_id).includes(q);
    const matchStatus = paymentFilter === 'all' || String(b.payment_status) === paymentFilter;
    return matchText && matchStatus;
  });

  return (
    <Layout pageTitle={<><i className="fas fa-file-invoice-dollar" style={{color:'var(--accent-primary)',marginRight:12}}/>Financial Billing</>}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h2 style={{ fontWeight:400, fontSize:'1.4rem', fontFamily: 'var(--font-display)' }}>
          <span className="text-secondary" style={{ fontFamily: 'var(--font-mono)', fontSize:'0.9rem', marginLeft: 16 }}>Showing: <strong>{filteredBills.length}</strong> / {bills.length}</span>
        </h2>
        {canAct && <button className="btn btn-primary" onClick={()=>{setForm(EMPTY_FORM);setModal(true);}}><i className="fas fa-plus"/> Generate Invoice</button>}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 200px', gap: 16, padding: '16px 20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
             <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                <input
                  className="form-control"
                  style={{ paddingLeft: 46 }}
                  placeholder="Search invoice by patient name or bill ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
             <select className="form-select" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
               <option value="all">All Transactions</option>
               <option value="Pending">Pending Payment</option>
               <option value="Partial">Partial Clearance</option>
               <option value="Paid">Fully Paid</option>
             </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-wrap"><div className="spinner"/></div> : (
          <div className="tbl-wrap" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
             <table style={{ margin: 0 }}>
              <thead><tr><th style={{ background: 'transparent' }}>Invoice#</th><th style={{ background: 'transparent' }}>Patient Name</th><th style={{ background: 'transparent' }}>Consultation</th><th style={{ background: 'transparent' }}>Pharmacy</th><th style={{ background: 'transparent' }}>Lab</th><th style={{ background: 'transparent' }}>Ward</th><th style={{ background: 'transparent' }}>Total Amount</th><th style={{ background: 'transparent' }}>Status</th><th style={{ background: 'transparent' }}>Date</th>{canAct&&<th style={{ textAlign: 'right', background: 'transparent' }}>Actions</th>}</tr></thead>
              <tbody>
                {filteredBills.length ? filteredBills.map(b => (
                  <tr key={b.bill_id}>
                    <td className="text-muted font-mono" style={{fontSize:'0.85rem'}}>INV-{String(b.bill_id).padStart(5, '0')}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.patient_name}</td>
                    <td className="font-mono text-secondary">₹{Number(b.consultation_fee).toFixed(0)}</td>
                    <td className="font-mono text-secondary">₹{Number(b.medicine_charge).toFixed(0)}</td>
                    <td className="font-mono text-secondary">₹{Number(b.lab_charge).toFixed(0)}</td>
                    <td className="font-mono text-secondary">₹{Number(b.ward_charge).toFixed(0)}</td>
                    <td><strong className="font-mono" style={{color:'var(--accent-primary)', fontSize: '1rem' }}>₹{Number(b.total_amount).toFixed(0)}</strong></td>
                    <td><span className={`badge badge-${b.payment_status?.toLowerCase()}`}>{b.payment_status}</span></td>
                    <td className="font-mono text-secondary" style={{fontSize:'0.85rem'}}>{b.bill_date ? new Date(b.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year:'numeric'}) : '—'}</td>
                    {canAct && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{display:'flex',gap:8, justifyContent: 'flex-end'}}>
                          {b.payment_status!=='Paid' && <button className="btn-icon" style={{ background: 'rgba(0, 196, 140, 0.1)', color: 'var(--accent-secondary)' }} onClick={()=>updatePayment(b.bill_id,'Paid')} title="Mark Fully Paid"><i className="fas fa-check-double"/></button>}
                          {b.payment_status==='Pending' && <button className="btn-icon" style={{ background: 'var(--surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} onClick={()=>updatePayment(b.bill_id,'Partial')} title="Record Partial Payment"><i className="fas fa-circle-half-stroke"/></button>}
                        </div>
                      </td>
                    )}
                  </tr>
                )) : <tr><td colSpan={10}><div className="empty-state"><i className="fas fa-file-invoice"/>No financial records found.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className="modal modal-lg" onClick={e=>e.stopPropagation()} style={{ 
            height: '100vh', maxHeight: '100vh', margin: 0, borderRadius: 0, maxWidth: 600,
            display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <i className="fas fa-file-invoice" style={{color:'var(--accent-primary)'}}/> Create Invoice
              </h3>
              <button className="btn-icon" onClick={()=>setModal(false)}><i className="fas fa-xmark"/></button>
            </div>
            
            <form onSubmit={handleSave} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="form-group"><label className="form-label">Patient Selection *</label>
                  <select className="form-select" required value={form.patient_id} onChange={e=>setForm(f=>({...f,patient_id:e.target.value}))}>
                    <option value="">Patient lookup…</option>
                    {patients.map(p=><option key={p.patient_id} value={p.patient_id}>{p.name} (ID: {String(p.patient_id).padStart(4, '0')})</option>)}
                  </select>
                </div>
                
                <div className="page-header" style={{ marginTop: 32, marginBottom: 16 }}>
                   <h2 style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}><i className="fas fa-building" style={{ fontSize: '1rem', color: 'var(--text-muted)' }} /> Base Charges</h2>
                </div>
                
                <div className="row row-3" style={{ gap: 16 }}>
                  <div className="form-group"><label className="form-label">Consultation (₹)</label>
                    <input type="number" className="form-control font-mono" min="0" step="0.01" value={form.consultation_fee} onChange={e=>setForm(f=>({...f,consultation_fee:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Lab / Tests (₹)</label>
                    <input type="number" className="form-control font-mono" min="0" step="0.01" value={form.lab_charge} onChange={e=>setForm(f=>({...f,lab_charge:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Ward / Bed (₹)</label>
                    <input type="number" className="form-control font-mono" min="0" step="0.01" value={form.ward_charge} onChange={e=>setForm(f=>({...f,ward_charge:e.target.value}))}/></div>
                </div>

                <div className="page-header" style={{ marginTop: 32, marginBottom: 16 }}>
                   <h2 style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}><i className="fas fa-pills" style={{ fontSize: '1rem', color: 'var(--text-muted)' }} /> Internal Pharmacy</h2>
                </div>

                {/* Medicine rows */}
                <div style={{marginBottom:16, background: 'var(--surface-hover)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <label className="form-label" style={{margin:0, display: 'flex', alignItems: 'center', gap: 6}}>
                       Itemized Medications 
                       <span style={{fontSize:'0.75rem',color:'var(--warning)',fontWeight:500, background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: 4}}><i className="fas fa-database" style={{marginRight:4}} />Stock triggers active</span>
                    </label>
                    <button type="button" className="btn btn-ghost" style={{ padding: '6px 12px' }} onClick={addMedRow}><i className="fas fa-plus"/>Add Item</button>
                  </div>
                  
                  {form.medicines.length === 0 && (
                     <p className="text-muted" style={{ fontSize: '0.85rem', textAlign: 'center', padding: '16px 0', margin: 0 }}>No pharmacy items appended.</p>
                  )}
                  
                  {form.medicines.map((m, i) => (
                    <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 100px 48px',gap:12,marginBottom:12}}>
                      <select className="form-select" value={m.medicine_id} onChange={e=>updateMed(i,'medicine_id',e.target.value)}>
                        <option value="">— Select drug —</option>
                        {medList.map(x=><option key={x.medicine_id} value={x.medicine_id}>{x.medicine_name} — ₹{x.price}/{x.unit} ({x.stock_quantity} available)</option>)}
                      </select>
                      <input type="number" className="form-control font-mono" min="1" placeholder="Qty" value={m.quantity} onChange={e=>updateMed(i,'quantity',e.target.value)}/>
                      <button type="button" className="btn-icon" style={{ background: 'var(--surface)', color: 'var(--danger)', height: 48, width: 48, borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)' }} onClick={()=>removeMedRow(i)}><i className="fas fa-trash"/></button>
                    </div>
                  ))}
                </div>

                {/* Live total preview */}
                <div style={{background:'rgba(0, 87, 255, 0.04)',borderRadius:'var(--radius-md)',padding:'24px',border:'1px dashed var(--accent-primary)', marginTop: 32}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                       <span style={{fontSize:'0.85rem',color:'var(--text-secondary)', display: 'block'}}>Estimated Due (Preview)</span>
                       <small style={{color:'var(--text-muted)',fontSize:'0.75rem', fontFamily: 'var(--font-mono)'}}>DB triggers enforce exact calculation</small>
                    </div>
                    <span className="font-mono" style={{fontSize:'1.8rem',fontWeight:700,color:'var(--accent-primary)', letterSpacing: '-0.03em'}}>₹{liveTotal().toFixed(0)}</span>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer" style={{ borderTop: 'none', boxShadow: '0 -10px 30px rgba(0,0,0,0.05)' }}>
                <button type="button" className="btn btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> Generating...</> : <><i className="fas fa-file-invoice"/> Generate Invoice</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
