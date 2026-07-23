import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1100 }} onClick={onCancel}>
      <div className="modal-dialog modal-dialog-centered modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-content glass-panel border-0">
          <div className="modal-header border-0">
            <div className="d-flex align-items-center gap-2">
              {isDestructive && <AlertTriangle size={20} color="var(--accent-danger, #ef4444)" />}
              <h5 className="modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h5>
            </div>
            <button type="button" className="btn-close" onClick={onCancel} aria-label="Close" style={{ filter: 'invert(0.7)' }} />
          </div>
          <div className="modal-body">
            <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              {message}
            </p>
          </div>
          <div className="modal-footer border-0 d-flex gap-2 justify-content-end">
            <button className="btn btn-secondary" onClick={onCancel}>
              {cancelText}
            </button>
            <button className={isDestructive ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};