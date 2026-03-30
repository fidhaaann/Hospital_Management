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
    <Layout pageTitle={<><i className="fas fa-receipt" style={{color:'var(--accent)',marginRight:8}}/>Billing</>}>
      <div className="page-header">
        <span className="text-muted" style={{fontSize:'0.85rem'}}>Showing: <strong>{filteredBills.length}</strong> / {bills.length} bills</span>
        {canAct && <button className="btn btn-primary btn-sm" onClick={()=>{setForm(EMPTY_FORM);setModal(true);}}><i className="fas fa-plus"/>Generate Bill</button>}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <input
            className="form-control"
            placeholder="Search by patient name or bill ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="form-select" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
            <option value="all">All payment status</option>
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-wrap"><div className="spinner"/></div> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Bill#</th><th>Patient</th><th>Consult</th><th>Medicine</th><th>Lab</th><th>Ward</th><th>Total</th><th>Status</th><th>Date</th>{canAct&&<th>Actions</th>}</tr></thead>
              <tbody>
                {filteredBills.length ? filteredBills.map(b => (
                  <tr key={b.bill_id}>
                    <td className="text-muted font-mono" style={{fontSize:'0.75rem'}}>#{b.bill_id}</td>
                    <td><strong>{b.patient_name}</strong></td>
                    <td>₹{Number(b.consultation_fee).toFixed(0)}</td>
                    <td>₹{Number(b.medicine_charge).toFixed(0)}</td>
                    <td>₹{Number(b.lab_charge).toFixed(0)}</td>
                    <td>₹{Number(b.ward_charge).toFixed(0)}</td>
                    <td><strong style={{color:'var(--primary-mid)'}}>₹{Number(b.total_amount).toFixed(0)}</strong></td>
                    <td><span className={`badge badge-${b.payment_status?.toLowerCase()}`}>{b.payment_status}</span></td>
                    <td style={{fontSize:'0.78rem'}}>{b.bill_date ? new Date(b.bill_date).toLocaleDateString('en-IN') : '—'}</td>
                    {canAct && (
                      <td>
                        <div style={{display:'flex',gap:5}}>
                          {b.payment_status!=='Paid' && <button className="btn btn-success btn-sm" onClick={()=>updatePayment(b.bill_id,'Paid')} title="Mark Paid"><i className="fas fa-check"/></button>}
                          {b.payment_status==='Pending' && <button className="btn btn-ghost btn-sm" style={{color:'var(--info)',borderColor:'#bfdbfe'}} onClick={()=>updatePayment(b.bill_id,'Partial')} title="Mark Partial"><i className="fas fa-circle-half-stroke"/></button>}
                        </div>
                      </td>
                    )}
                  </tr>
                )) : <tr><td colSpan={10}><div className="empty-state"><i className="fas fa-receipt"/>No bills match the filters.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-file-invoice" style={{color:'var(--primary-mid)',marginRight:8}}/>Generate Bill</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setModal(false)}><i className="fas fa-xmark"/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Patient *</label>
                  <select className="form-select" required value={form.patient_id} onChange={e=>setForm(f=>({...f,patient_id:e.target.value}))}>
                    <option value="">Select patient…</option>
                    {patients.map(p=><option key={p.patient_id} value={p.patient_id}>{p.name}</option>)}
                  </select></div>
                <div className="row row-3">
                  <div className="form-group"><label className="form-label">Consultation Fee (₹)</label>
                    <input type="number" className="form-control" min="0" step="0.01" value={form.consultation_fee} onChange={e=>setForm(f=>({...f,consultation_fee:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Lab Charge (₹)</label>
                    <input type="number" className="form-control" min="0" step="0.01" value={form.lab_charge} onChange={e=>setForm(f=>({...f,lab_charge:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Ward Charge (₹)</label>
                    <input type="number" className="form-control" min="0" step="0.01" value={form.ward_charge} onChange={e=>setForm(f=>({...f,ward_charge:e.target.value}))}/></div>
                </div>

                {/* Medicine rows */}
                <div style={{marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <label className="form-label" style={{margin:0}}>Medicines <span style={{fontSize:'0.72rem',color:'var(--text-muted)',fontWeight:400}}>(stock deducted by DB trigger)</span></label>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addMedRow}><i className="fas fa-plus"/>Add Medicine</button>
                  </div>
                  {form.medicines.map((m, i) => (
                    <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 100px 40px',gap:8,marginBottom:8}}>
                      <select className="form-select" value={m.medicine_id} onChange={e=>updateMed(i,'medicine_id',e.target.value)}>
                        <option value="">— Select medicine —</option>
                        {medList.map(x=><option key={x.medicine_id} value={x.medicine_id}>{x.medicine_name} — ₹{x.price}/{x.unit} ({x.stock_quantity} in stock)</option>)}
                      </select>
                      <input type="number" className="form-control" min="1" placeholder="Qty" value={m.quantity} onChange={e=>updateMed(i,'quantity',e.target.value)}/>
                      <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={()=>removeMedRow(i)}><i className="fas fa-trash"/></button>
                    </div>
                  ))}
                </div>

                {/* Live total preview */}
                <div style={{background:'var(--accent-dim)',borderRadius:10,padding:'14px 18px',border:'1px dashed var(--accent)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'0.85rem',color:'var(--primary-mid)'}}>Estimated Total (preview)</span>
                    <span style={{fontSize:'1.5rem',fontWeight:700,color:'var(--primary-mid)'}}>₹{liveTotal().toFixed(0)}</span>
                  </div>
                  <small style={{color:'var(--text-muted)',fontSize:'0.72rem'}}>Actual total calculated by MySQL trigger on save</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving?'Generating…':<><i className="fas fa-file-invoice"/>Generate Bill</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
