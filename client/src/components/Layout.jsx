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
  const [notifications] = useState([
    { id: 1, type: 'critical', text: 'Dr. Smith requested immediate lab results.', time: '2m ago' },
    { id: 2, type: 'system', text: 'System backup completed successfully.', time: '1h ago' },
  ]);

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
        width: sidebarW, minHeight: '100vh', position: 'fixed', top: 0, left: 0,
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
                 <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: 1 }}>
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
          <h5 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{pageTitle}</h5>
          
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

            {/* Notification Bell */}
            <button className="btn-icon" onClick={() => setShowDrawer(true)} style={{ position: 'relative' }}>
              <i className="fas fa-bell"></i>
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
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
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>Notifications</h3>
                  <button className="btn-icon" onClick={() => setShowDrawer(false)}><i className="fas fa-times"></i></button>
               </div>
               <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto' }}>
                  {notifications.map(n => (
                     <div key={n.id} style={{ 
                        padding: '16px', marginBottom: 16, borderRadius: 'var(--radius-md)', 
                        background: 'var(--surface-hover)', borderLeft: `4px solid ${n.type === 'critical' ? 'var(--danger)' : 'var(--info)'}`
                     }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                           <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{n.type} Alert</strong>
                           <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.time}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{n.text}</p>
                     </div>
                  ))}
               </div>
               <div style={{ padding: '20px 28px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                 <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setShowDrawer(false)}>Mark all as read</button>
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
