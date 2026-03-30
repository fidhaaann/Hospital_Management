import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ username: '', password: '', role: 'receptionist' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      await login(form.username, form.password, form.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a2e1f 0%, #1a6b4a 55%, #0a2e1f 100%)',
      position: 'relative', overflow: 'hidden', padding: 16,
    }}>
      {/* decorative circles */}
      {[[-120,-80,400],[400,300,300],[-60,400,200]].map(([x,y,s],i) => (
        <div key={i} style={{
          position:'absolute', left: x, top: y, width: s, height: s, borderRadius:'50%',
          background:'rgba(0,229,160,0.06)', pointerEvents:'none',
        }}/>
      ))}

      <div style={{
        background: '#fff', borderRadius: 22, padding: '48px 44px 40px',
        width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
        boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 20px 60px rgba(0,0,0,0.28)',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 66, height: 66, borderRadius: 18, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #1a6b4a, #00e5a0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', color: '#fff',
            boxShadow: '0 10px 28px rgba(26,107,74,0.40)',
          }}>
            <i className="fas fa-heartbeat" />
          </div>
          <h1 style={{ fontFamily: 'var(--font)', fontSize: '1.7rem', fontWeight: 700, color: '#111c17', marginBottom: 4 }}>
            <span style={{ color: '#1a6b4a' }}>Medi</span>Core
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#7a9488' }}>Hospital Management System</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-user" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ab0a5', fontSize:'0.85rem' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 36 }}
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-lock" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ab0a5', fontSize:'0.85rem' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: 36, paddingRight: 40 }}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ab0a5',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  padding: 0
                }}
              >
                <i className={`fas fa-eye${showPassword ? '' : '-slash'}`} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Login As</label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-briefcase" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ab0a5', fontSize:'0.85rem' }} />
              <select
                className="form-control"
                style={{ paddingLeft: 36 }}
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="receptionist">Receptionist</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', padding: 13, justifyContent: 'center', marginTop: 6, fontSize: '0.95rem', borderRadius: 11 }}>
            {loading
              ? <><span className="spinner" style={{ width:18,height:18,borderWidth:2 }} /> Signing in…</>
              : <><i className="fas fa-sign-in-alt" /> Sign In</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: '0.74rem', color: '#9ab0a5' }}>
          <i className="fas fa-shield-alt" style={{ marginRight: 5 }} />
          Secure access — authorised personnel only
        </p>
      </div>
    </div>
  );
}
