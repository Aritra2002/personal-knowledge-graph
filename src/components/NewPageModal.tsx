import React, { useState, useEffect, useRef } from 'react';
import { FileText } from 'lucide-react';

interface NewPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}

export const NewPageModal: React.FC<NewPageModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleClose = () => {
    setTitle('');
    onClose();
  };

  const handleCreate = () => {
    const finalTitle = title.trim();
    if (finalTitle) {
      onCreate(finalTitle);
      setTitle('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1060 }} onClick={handleClose}>
      <div className="modal-dialog modal-dialog-centered modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-content glass-panel border-0">
          <div className="modal-header border-0">
            <div className="d-flex align-items-center gap-2">
              <FileText size={18} />
              <h5 className="modal-title" style={{ margin: 0 }}>Create New Page</h5>
            </div>
            <button type="button" className="btn-close btn-close-overlay" onClick={handleClose} aria-label="Close" />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <input
                ref={inputRef}
                type="text"
                className="form-control"
                placeholder="Page Name..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
          <div className="modal-footer border-0 d-flex gap-2 justify-content-end">
            <button className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={!title.trim()}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};