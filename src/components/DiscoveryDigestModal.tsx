import React, { useState, useEffect, useRef } from 'react';
import type { Note } from '../db';
import { callAI } from '../utils/aiClient';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Sparkles } from 'lucide-react';

interface DiscoveryDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
}

export const DiscoveryDigestModal: React.FC<DiscoveryDigestModalProps> = ({ isOpen, onClose, notes }) => {
  const [digest, setDigest] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDigest(null);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isLoading) return;

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setDigest(null);
      setError('');

      const now = Date.now();
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      const oldNotes = notes.filter(n => n.createdAt < oneMonthAgo);
      const recentNotes = notes.filter(n => n.createdAt > sevenDaysAgo);

      if (oldNotes.length === 0 || recentNotes.length === 0) {
        if (!cancelled) {
          setError('Not enough notes for a digest. Keep writing!');
          setIsLoading(false);
        }
        return;
      }

      const randomOld = oldNotes[Math.floor(Math.random() * oldNotes.length)];
      const randomRecent = recentNotes[Math.floor(Math.random() * recentNotes.length)];

      const systemPrompt = `You are an AI assistant helping discover surprising connections in a personal knowledge graph.`;
      const userPrompt = `Given these two notes, find a surprising connection between them.\n\nNote 1 (Old):\nTitle: ${randomOld.title}\nContent: ${randomOld.content}\n\nNote 2 (Recent):\nTitle: ${randomRecent.title}\nContent: ${randomRecent.content}\n\nProvide a short, insightful connection.`;

      abortRef.current?.abort();
      abortRef.current = new AbortController();
      try {
        await callAI(systemPrompt, userPrompt, (text) => {
          if (!cancelled) setDigest(text);
        }, abortRef.current.signal);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error generating digest');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, notes]);

  if (!isOpen) return null;

  return (
    <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1060 }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-content glass-panel border-0">
          <div className="modal-header border-0">
            <div className="d-flex align-items-center gap-2" style={{ color: 'var(--accent-gold)' }}>
              <Sparkles size={18} />
              <h5 className="modal-title">Daily Discovery Digest</h5>
            </div>
            <button type="button" className="btn-close btn-close-overlay" onClick={onClose} aria-label="Close" />
          </div>
          <div className="modal-body">
            {error && <div style={{ color: '#ef4444' }}>{error}</div>}
            {isLoading && !digest && <div className="spin-pulse" style={{ color: 'var(--text-secondary)' }}>Finding a surprising connection...</div>}
            {digest && (
              <div className="markdown-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(digest) as string) }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};