import { useState, useEffect, useRef } from 'react';


interface PromptModalProps {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptModal({ title, message, placeholder = '', defaultValue = '', onConfirm, onCancel }: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1100 }} onClick={onCancel}>
      <div className="modal-dialog modal-dialog-centered modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-content glass-panel border-0">
          <div className="modal-header border-0">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close btn-close-overlay" onClick={onCancel} aria-label="Close" />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onConfirm(value); }}>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
                {message}
              </p>
              <input
                ref={inputRef}
                type="text"
                className="form-control"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
              />
            </div>
            <div className="modal-footer border-0 d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Confirm
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}