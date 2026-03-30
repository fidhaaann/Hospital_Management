import React from 'react';

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  confirmText = 'Confirm',
  confirmIcon = 'fa-check',
  confirmClass = 'btn-danger',
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 420, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ paddingBottom: 16 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             <i className="fas fa-triangle-exclamation" style={{ color: 'var(--warning)', fontSize: '1.2rem' }} />
             {title}
          </h3>
        </div>
        <div className="modal-body" style={{ padding: '24px', paddingTop: 8 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5, margin: 0 }}>{message}</p>
        </div>
        <div className="modal-footer" style={{ padding: '16px 24px', background: 'var(--surface-hover)', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${confirmClass}`} onClick={onConfirm} style={{ boxShadow: 'var(--shadow-sm)' }}>
             <i className={`fas ${confirmIcon}`} /> {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
