import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from './ConfirmDialog';

const NAV = [
  { section: 'Main', items: [
    { to: '/dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
  ]},
  { section: 'Patient Care', items: [
    { to: '/patients',      icon: 'fa-user-injured',   label: 'Patients' },
    { to: '/appointments',  icon: 'fa-calendar-check', label: 'Appointments' },
    { to: '/prescriptions', icon: 'fa-file-medical',   label: 'Prescriptions' },
  ]},
  { section: 'Hospital', items: [
    { to: '/doctors',   icon: 'fa-user-md', label: 'Doctors' },
    { to: '/wards',     icon: 'fa-bed',     label: 'Wards' },
    { to: '/medicines', icon: 'fa-pills',   label: 'Pharmacy' },
    { to: '/bills',     icon: 'fa-receipt', label: 'Billing' },
  ]},
];

const ADMIN_NAV = [
  { section: 'Admin', items: [
    { to: '/analytics', icon: 'fa-chart-bar',   label: 'Analytics' },
    { to: '/users',     icon: 'fa-users-cog',   label: 'Users' },
  ]},
];

export default function Layout({ children, pageTitle, toast }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('medicore-theme') || 'light');
  const [showDrawer, setShowDrawer] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showCompose, setShowCompose] = useState(false);
  const [composeMsg, setComposeMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(''); // empty string means 'All Doctors'

  useEffect(() => {
    if (showCompose && doctors.length === 0) {
      fetch('http://localhost:5000/api/notifications/doctors-list', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setDoctors(Array.isArray(data) ? data : []))
        .catch(err => console.error(err));
    }
  }, [showCompose, doctors.length]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications', { credentials: 'include' });
      if (res.ok) setNotifications(await res.json());
    } catch (err) { }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('http://localhost:5000/api/notifications/read', { method: 'PUT', credentials: 'include' });
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
    } catch (err) { }
  };

  const handleSendNote = async () => {
    if (!composeMsg.trim()) return;
    setIsSending(true);
    
    // If a specific doctor is selected, recipient_role is null and recipient_id is their user_id.
    // Otherwise, recipient_role = 'doctor' stands for all doctors
    const recipient_role = selectedDoctorId ? null : 'doctor';
    const recipient_id = selectedDoctorId || null;

    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: composeMsg, recipient_role, recipient_id, type: 'message' }),
      });
      if (res.ok) {
        setShowCompose(false);
        setComposeMsg('');
        if (toast) toast.success('Note sent successfully');
        else alert('Note sent successfully!');
        fetchNotifications();
      } else alert('Failed to send note.');
    } catch (err) {
      alert('Error sending note.');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('medicore-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarW = collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)';

  return (
    <div className="layout-root" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Sidebar ── */}
      <nav style={{
        width: sidebarW, height: '100vh', position: 'fixed', top: 0, left: 0,
        background: 'var(--surface)', display: 'flex', flexDirection: 'column', zIndex: 200,
        transition: 'width var(--transition-normal)', overflowX: 'hidden',
        borderRight: '1px solid var(--border)'
      }}>
        {/* Brand */}
        <div style={{
          padding: collapsed ? '24px 0' : '28px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12, justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <i className="fas fa-heart-pulse" style={{ color: 'var(--accent-primary)', fontSize: '1.4rem' }} />
               <div>
                 <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: '1.4rem', letterSpacing: '0.1em', color: 'var(--text-primary)', lineHeight: 1 }}>
                   MediCore
                 </div>
               </div>
            </div>
          )}
          {collapsed && <i className="fas fa-heart-pulse" style={{ color: 'var(--accent-primary)', fontSize: '1.6rem' }} />}
          <button onClick={() => setCollapsed(c => !c)} className="btn-icon" style={{ flexShrink: 0 }}>
            <i className={`fas fa-${collapsed ? 'indent' : 'outdent'}`} style={{ fontSize: '1rem' }} />
          </button>
        </div>

        {/* User badge */}
        {!collapsed && (
          <div style={{ padding: '20px 24px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ 
                  width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-hover)', 
                  border: '1.5px solid var(--accent-primary)', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '1.1rem' 
               }}>
                  {user?.full_name?.charAt(0) || 'U'}
               </div>
               <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{user?.full_name}</div>
                  <span className={`badge badge-${user?.role}`}>{user?.role}</span>
               </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {[...NAV, ...(user?.role === 'admin' ? ADMIN_NAV : [])].map(section => (
            <div key={section.section} style={{ marginBottom: 12 }}>
              {!collapsed && (
                <div style={{
                  padding: '8px 24px 8px', fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)',
                }}>
                  {section.section}
                </div>
              )}
              {section.items.map(item => (
                <NavLink key={item.to} to={item.to} title={item.label} style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: collapsed ? '14px 0' : '12px 24px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--surface-hover)' : 'transparent',
                  borderLeft: isActive ? '4px solid var(--accent-primary)' : '4px solid transparent',
                  textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600,
                  transition: 'var(--transition-fast)',
                  position: 'relative'
                })}>
                  {({ isActive }) => (
                     <>
                        <i className={`fas ${item.icon}`} style={{ width: 22, textAlign: 'center', fontSize: '1.1rem', flexShrink: 0, color: isActive ? 'var(--accent-primary)' : 'inherit' }} />
                        {!collapsed && item.label}
                     </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Logout */}
        <div style={{ padding: collapsed ? '20px 0' : '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <button onClick={() => setConfirmLogout(true)} className="btn btn-ghost" style={{ width: collapsed ? 'auto' : '100%', padding: collapsed ? '8px' : '10px 16px', color: 'var(--text-secondary)', border: 'none' }} title="Logout">
            <i className="fas fa-sign-out-alt" style={{ fontSize: '1.1rem' }} />
            {!collapsed && 'Log Out'}
          </button>
        </div>
      </nav>

      {/* ── Main content ── */}
      <div style={{ marginLeft: sidebarW, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left var(--transition-normal)' }}>
        {/* Top bar (Glassmorphism) */}
        <div style={{
          background: theme === 'dark' ? 'rgba(15, 24, 38, 0.7)' : 'rgba(255, 255, 255, 0.7)', 
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 32px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <h5 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>{pageTitle}</h5>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <i className="fas fa-clock" style={{ marginRight: 8, color: 'var(--accent-primary)' }} />
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>

            <div style={{ width: 1, height: 24, background: 'var(--border)' }}></div>

            {/* Theme Toggle */}
            <div className="theme-switch-wrapper" onClick={toggleTheme}>
              <div className="theme-switch">
                 <div className="theme-switch-thumb"></div>
                 <i className="fas fa-sun"></i>
                 <i className="fas fa-moon"></i>
              </div>
            </div>

            {/* Create Message Button (only for non-doctors) */}
            {user?.role !== 'doctor' && (
              <button className="btn-icon" onClick={() => setShowCompose(true)} title="Send Note to Doctors">
                <i className="fas fa-envelope"></i>
              </button>
            )}

            {/* Notification Bell */}
            <button className="btn-icon" onClick={() => setShowDrawer(true)} style={{ position: 'relative' }}>
              <i className="fas fa-bell"></i>
              {notifications.some(n => !n.is_read) && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
              )}
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: '32px', flex: 1, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </div>

      {/* Notification Drawer Shell */}
      {showDrawer && (
         <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => setShowDrawer(false)}></div>
            <div style={{ 
               width: 380, background: 'var(--surface)', height: '100%', position: 'relative', 
               borderLeft: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-lg)',
               animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
               display: 'flex', flexDirection: 'column'
            }}>
               <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.4rem' }}>Notifications</h3>
                  <button className="btn-icon" onClick={() => setShowDrawer(false)}><i className="fas fa-times"></i></button>
               </div>
               <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>No notifications</div>
                  ) : notifications.map(n => (
                     <div key={n.id} style={{ 
                        padding: '16px', marginBottom: 16, borderRadius: 'var(--radius-md)', 
                        background: n.is_read ? 'transparent' : 'var(--surface-hover)', 
                        border: '1px solid var(--border)',
                        borderLeft: `4px solid ${n.type === 'critical' ? 'var(--danger)' : n.type === 'message' ? 'var(--accent-primary)' : 'var(--info)'}`
                     }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                           <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                              {n.type === 'message' && n.sender_name ? `Note from ${n.sender_name}` : `${n.type} Alert`}
                              {!n.is_read && <span style={{ marginLeft: 8, color: 'var(--danger)', fontSize: '0.7rem', fontWeight: 900 }}>NEW</span>}
                           </strong>
                           <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{n.message}</p>
                     </div>
                  ))}
               </div>
               <div style={{ padding: '20px 28px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                 <button className="btn btn-ghost" style={{ width: '100%' }} onClick={handleMarkAllRead}>Mark all as read</button>
               </div>
            </div>
         </div>
      )}

      {/* Compose Note Modal */}
      {showCompose && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }} onClick={() => setShowCompose(false)}></div>
          <div style={{ background: 'var(--surface)', padding: 32, borderRadius: 'var(--radius-lg)', width: 400, position: 'relative', boxShadow: 'var(--shadow-xl)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Send Note to Doctors</h3>
            
            <div style={{ marginBottom: 16 }}>
               <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Recipient</label>
               <select 
                  value={selectedDoctorId} 
                  onChange={e => setSelectedDoctorId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)' }}
               >
                  <option value="">All Doctors (Broadcast)</option>
                  {doctors.map(doc => (
                     <option key={doc.user_id} value={doc.user_id}>Dr. {doc.full_name}</option>
                  ))}
               </select>
            </div>

            <textarea 
              value={composeMsg}
              onChange={e => setComposeMsg(e.target.value)}
              placeholder="Type your message here..."
              style={{ width: '100%', minHeight: 120, boxSizing: 'border-box', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setShowCompose(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSendNote} disabled={isSending}>
                {isSending ? 'Sending...' : 'Send Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmLogout && (
        <ConfirmDialog
          title="Secure Logout"
          message="Are you sure you want to end your session?"
          confirmText="Log Out"
          confirmIcon="fa-sign-out-alt"
          confirmClass="btn-danger"
          onCancel={() => setConfirmLogout(false)}
          onConfirm={async () => {
            setConfirmLogout(false);
            await handleLogout();
          }}
        />
      )}
    </div>
  );
}
