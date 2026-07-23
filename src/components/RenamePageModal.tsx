import React, { useState, useEffect } from 'react';

import { db } from '../db';

interface RenamePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: number;
  currentTitle: string;
}

export const RenamePageModal: React.FC<RenamePageModalProps> = ({
  isOpen,
  onClose,
  pageId,
  currentTitle
}) => {
  const [title, setTitle] = useState(currentTitle);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(currentTitle);
  }, [currentTitle]);

  const handleClose = () => {
    setTitle(currentTitle);
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      await db.pages.update(pageId, { title: title.trim() });
      onClose();
    }
  };

  return (
    <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1060 }} onClick={handleClose}>
      <div className="modal-dialog modal-dialog-centered modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-content glass-panel border-0">
          <div className="modal-header border-0">
            <h5 className="modal-title">Rename Page</h5>
            <button type="button" className="btn-close" onClick={handleClose} aria-label="Close" style={{ filter: 'invert(0.7)' }} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="pageTitle" className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page Title</label>
                <input
                  id="pageTitle"
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Work, Ideas, D&D Campaign"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer border-0 d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};