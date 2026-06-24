import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

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
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="settings-modal" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isDestructive && <AlertTriangle size={20} color="#ef4444" />}
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h2>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Close"><X size={20} /></button>
        </div>
        
        <div className="modal-content" style={{ paddingBottom: '24px' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
            {message}
          </p>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
            <button 
              className="icon-btn" 
              onClick={onCancel}
              style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--surface-color)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {cancelText}
            </button>
            <button 
              className="icon-btn" 
              onClick={onConfirm}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '6px', 
                background: isDestructive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)', 
                color: isDestructive ? '#ef4444' : '#818cf8', 
                border: `1px solid ${isDestructive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
                fontWeight: 500
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
