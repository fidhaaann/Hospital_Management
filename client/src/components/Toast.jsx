import React from 'react';

const iconMap = {
  success: 'fa-circle-check',
  danger:  'fa-circle-exclamation',
  warning: 'fa-triangle-exclamation',
  info:    'fa-circle-info',
};

export default function ToastContainer({ toasts, dismiss }) {
  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360, width: '100%',
    }}>
      {toasts.map(t => (
        <div key={t.id} className={`alert alert-${t.type}`}
          style={{ 
            boxShadow: 'var(--shadow-lg)', cursor: 'pointer', 
            animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            background: 'var(--surface)', margin: 0,
            borderLeft: `4px solid var(--${t.type === 'error' ? 'danger' : t.type === 'success' ? 'accent-secondary' : t.type})`
          }}
          onClick={() => dismiss(t.id)}>
          <i className={`fas ${iconMap[t.type] || iconMap.info}`} style={{ marginTop: 2, fontSize: '1.1rem' }} />
          <span style={{ flex: 1, fontWeight: 500, color: 'var(--text-primary)' }}>{t.message}</span>
          <i className="fas fa-xmark" style={{ opacity: 0.5, fontSize: '0.9rem', padding: 4, cursor: 'pointer' }} />
        </div>
      ))}
    </div>
  );
}
