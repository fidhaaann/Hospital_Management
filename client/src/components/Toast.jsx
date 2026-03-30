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
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340,
    }}>
      {toasts.map(t => (
        <div key={t.id} className={`alert alert-${t.type}`}
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)', cursor: 'pointer', animation: 'slideUp 0.2s ease' }}
          onClick={() => dismiss(t.id)}>
          <i className={`fas ${iconMap[t.type] || iconMap.info}`} />
          <span style={{ flex: 1 }}>{t.message}</span>
          <i className="fas fa-xmark" style={{ opacity: 0.5, fontSize: '0.8rem' }} />
        </div>
      ))}
    </div>
  );
}
