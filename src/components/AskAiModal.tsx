import React, { useState, useEffect, useRef } from 'react';
import type { Note } from '../db';
import { callAI } from '../utils/aiClient';
import { semanticSearch } from '../utils/vectorSearch';
import { marked } from 'marked';
import { Sparkles, X, ArrowRight } from 'lucide-react';

interface AskAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
}

export const AskAiModal: React.FC<AskAiModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setAiResponse(null);
      setIsAiLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleAskAi = async () => {
    if (!query.trim()) return;
    
    try {
      setIsAiLoading(true);
      setAiResponse('');
      
      // Perform Local RAG: Find top 5 relevant notes based on the user's query
      const relevantNotes = await semanticSearch(query, 5);
      
      const systemPrompt = `You are an AI assistant analyzing a personal knowledge graph. You will be provided with the most relevant notes retrieved via semantic search. Use ONLY the provided notes to answer the user's question. If the answer is not in the notes, say so. Keep your answer concise.`;
      
      const notesContext = relevantNotes.length > 0 
        ? relevantNotes.map(n => `Title: ${n.title}\nContent: ${n.content}`).join('\n\n---\n\n')
        : "No highly relevant notes found for this query in the local graph.";

      const userPrompt = `Retrieved Notes:\n<cache>\n${notesContext}\n</cache>\n\nQuestion: ${query}`;
      
      await callAI(systemPrompt, userPrompt, (fullText) => {
        setAiResponse(fullText);
      });
      
    } catch (e: any) {
      setAiResponse(`Error: ${e.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !isAiLoading && aiResponse === null) {
      e.preventDefault();
      handleAskAi();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="settings-modal glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--node-amber)' }}>
            <Sparkles size={18} />
            <h2>Ask AI</h2>
          </div>
          <button className="icon-btn close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-content" style={{ padding: '20px' }}>
          {aiResponse !== null ? (
            <div className="ai-response-container" style={{ color: 'var(--text-primary)', maxHeight: '400px', overflowY: 'auto' }}>
              {isAiLoading && !aiResponse && <div className="spin-pulse" style={{ color: 'var(--text-secondary)' }}>Analyzing your knowledge graph...</div>}
              <div className="markdown-body" dangerouslySetInnerHTML={{ __html: marked.parse(aiResponse) as string }} />
              
              {!isAiLoading && (
                <button 
                  className="settings-action-btn" 
                  onClick={() => {
                    setAiResponse(null);
                    setQuery('');
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  style={{ marginTop: '20px' }}
                >
                  Ask Another Question
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Ask a question about your notes. The AI will search your personal knowledge graph to find the answer.
              </p>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="What do you want to know?"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
                <button 
                  className="primary-btn" 
                  onClick={handleAskAi}
                  disabled={!query.trim() || isAiLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '8px', padding: 0 }}
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
