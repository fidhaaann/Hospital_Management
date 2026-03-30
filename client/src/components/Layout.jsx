import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from './ConfirmDialog';

const NAV = [
  { section: 'Main', items: [
    { to: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarW = collapsed ? 64 : 256;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <nav style={{
        width: sidebarW, minHeight: '100vh', position: 'fixed', top: 0, left: 0,
        background: 'linear-gradient(180deg, #0a2e1f 0%, #0f4c35 100%)',
        display: 'flex', flexDirection: 'column', zIndex: 200,
        transition: 'width 0.2s', overflowX: 'hidden',
        boxShadow: '2px 0 20px rgba(0,0,0,0.15)',
      }}>
        {/* Brand */}
        <div style={{
          padding: collapsed ? '20px 0' : '22px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '1.25rem', color: '#fff' }}>
                <span style={{ color: 'var(--accent)' }}>Medi</span>Core
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', letterSpacing: 1 }}>HOSPITAL MANAGEMENT</div>
            </div>
          )}
          {collapsed && <i className="fas fa-heart-pulse" style={{ color: 'var(--accent)', fontSize: '1.3rem' }} />}
          <button onClick={() => setCollapsed(c => !c)} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6,
            width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className={`fas fa-${collapsed ? 'chevron-right' : 'chevron-left'}`} style={{ fontSize: '0.7rem' }} />
          </button>
        </div>

        {/* User badge */}
        {!collapsed && (
          <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem', marginBottom: 3 }}>{user?.full_name}</div>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
        )}

        {/* Nav links */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {[...NAV, ...(user?.role === 'admin' ? ADMIN_NAV : [])].map(section => (
            <div key={section.section}>
              {!collapsed && (
                <div style={{
                  padding: '14px 20px 5px', fontSize: '0.62rem', fontWeight: 700,
                  letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
                }}>
                  {section.section}
                </div>
              )}
              {section.items.map(item => (
                <NavLink key={item.to} to={item.to} title={item.label} style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: collapsed ? '12px 0' : '10px 20px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                  transition: 'all 0.15s',
                })}>
                  <i className={`fas ${item.icon}`} style={{ width: 18, textAlign: 'center', fontSize: '0.9rem', flexShrink: 0 }} />
                  {!collapsed && item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Logout */}
        <div style={{ padding: collapsed ? '16px 0' : '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <button onClick={() => setConfirmLogout(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center',
            gap: 8, fontSize: '0.85rem', fontFamily: 'var(--font)',
          }} title="Logout">
            <i className="fas fa-sign-out-alt" />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </nav>

      {/* ── Main content ── */}
      <div style={{ marginLeft: sidebarW, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.2s' }}>
        {/* Top bar */}
        <div style={{
          background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          padding: '13px 28px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{pageTitle}</h5>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <i className="fas fa-clock" style={{ marginRight: 6 }} />
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: 28, flex: 1 }}>
          {children}
        </div>
      </div>

      {confirmLogout && (
        <ConfirmDialog
          title="Logout"
          message="Are you sure you want to log out?"
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
