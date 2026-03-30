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
      background: 'var(--bg)',
      position: 'relative', overflow: 'hidden', padding: 24,
    }}>
      {/* Premium background decorative blur elements */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '60vw', height: '60vw',
        background: 'var(--accent-primary)', opacity: 0.04, filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-5%', width: '50vw', height: '50vw',
        background: 'var(--accent-secondary)', opacity: 0.04, filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none'
      }}></div>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px',
        width: '100%', maxWidth: 440, position: 'relative', zIndex: 1,
        boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 'var(--radius-lg)', margin: '0 auto 24px',
            background: 'linear-gradient(135deg, var(--accent-primary), #0099FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', color: '#fff',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <i className="fas fa-heart-pulse" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1 }}>
            MediCore
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', letterSpacing: '0.02em', margin: 0 }}>Precision Healthcare Administration</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 24, padding: 16, animation: 'shake 0.3s ease-in-out' }}>
            <i className="fas fa-triangle-exclamation" style={{ marginTop: 2, fontSize: '1.1rem' }} />
            <span style={{ fontWeight: 600 }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-user-circle" style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:'1.1rem' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 46, height: 48 }}
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-lock" style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:'1rem' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: 46, paddingRight: 48, height: 48 }}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn-icon"
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  width: 32, height: 32, color: 'var(--text-muted)',
                }}
              >
                <i className={`fas fa-eye${showPassword ? '' : '-slash'}`} />
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 32 }}>
            <label className="form-label">Portal Access Role</label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-shield-alt" style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:'1rem' }} />
              <select
                className="form-select"
                style={{ paddingLeft: 46, height: 48 }}
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="receptionist">Receptionist</option>
                <option value="doctor">Medical Practitioner</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', height: 48, fontSize: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: 10 }}>
            {loading
              ? <><span className="spinner" style={{ width:20, height:20, borderWidth:2 }} /> Authenticating...</>
              : <><i className="fas fa-arrow-right-to-bracket" /> Access System</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 32, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '32px 0 0 0', gap: 8 }}>
          <i className="fas fa-lock" />
          End-to-End Encrypted Session
        </p>
      </div>
    </div>
  );
}
