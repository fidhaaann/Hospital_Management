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
      <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-triangle-exclamation" style={{ color: 'var(--warning)', marginRight: 8 }} />{title}</h3>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-mid)', fontSize: '0.9rem' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          <button className={`btn ${confirmClass} btn-sm`} onClick={onConfirm}>
            <i className={`fas ${confirmIcon}`} /> {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
