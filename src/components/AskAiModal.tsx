import React, { useState, useEffect, useRef } from 'react';

import { callAI } from '../utils/aiClient';
import { semanticSearch } from '../utils/vectorSearch';
import { searchDocuments, buildRagContext } from '../utils/rag';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Sparkles, ArrowRight } from 'lucide-react';
import { parseAiResponse, executeAiAction, validateActionPreflight, AiAction } from '../utils/aiActions';
import { fetchUrlContent } from '../utils/urlFetcher';
import { ConfirmActionToast } from './ConfirmActionToast';
import { useToast } from './ToastContext';

interface AskAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePageId: number;
}

const AiActionCard = ({ result }: { result: { action: AiAction; success: boolean; message: string } }) => {
  if (!result.success) return <div style={{ color: 'var(--accent-danger, #ef4444)', marginTop: '12px' }}>Action failed: {result.message}</div>;
  
  if (result.action.action === 'create_note') {
    return (
      <div style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid var(--accent-primary)', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
        <div>Created note: <strong>"{result.action.title}"</strong></div>
        {result.action.tags && result.action.tags.length > 0 && (
          <div style={{ fontSize: '0.9em', color: 'var(--text-secondary)', marginTop: '4px' }}>Tags: {result.action.tags.join(', ')}</div>
        )}
        {result.action.linkTo && result.action.linkTo.length > 0 && (
          <div style={{ fontSize: '0.9em', color: 'var(--text-secondary)', marginTop: '4px' }}>Linked to: {result.action.linkTo.join(', ')}</div>
        )}
      </div>
    );
  }
  return (
    <div style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid var(--accent-primary)', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
      {result.message}
    </div>
  );
};

export const AskAiModal: React.FC<AskAiModalProps> = ({ isOpen, onClose, activePageId }) => {
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [stagedActions, setStagedActions] = useState<AiAction[]>([]);
  const [actionResults, setActionResults] = useState<{ action: AiAction; success: boolean; message: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { showToast } = useToast();

  const pageId = activePageId;

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery('');
      setAiResponse(null);
      setIsAiLoading(false);
      setStagedActions([]);
      setActionResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleAskAi = async () => {
    if (!query.trim()) return;
    
    try {
      setIsAiLoading(true);
      setAiResponse('');
      setActionResults([]);
      setStagedActions([]);
      
      let finalQuery = query;
      let contextPrefix = "";

      const urlMatch = query.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const url = urlMatch[0];
        try {
          const fetched = await fetchUrlContent(url);
          if (fetched) {
            contextPrefix = `[Content from URL]\n\n---\n\n${fetched.text}\n\n---\nUser message: `;
          } else {
            setAiResponse("I can't fetch that URL directly due to browser security restrictions. Paste the text or abstract here and I'll create the note.");
            setIsAiLoading(false);
            return;
          }
        } catch (e: unknown) {
          showToast(e instanceof Error ? e.message : 'Error fetching URL', 'error');
          setIsAiLoading(false);
          return;
        }
      }

      finalQuery = contextPrefix ? contextPrefix + query : query;
      
      const asksAboutOwnData = /(?:my|the|from|in|across|among)\s+(?:notes?|documents?|files?|data|knowledge|graph|nodes?|content|uploaded)/i.test(query)
        || /what\s+(?:do\s+)?(?:I|we)\s+have\s+(?:on|about|regarding)/i.test(query)
        || /(?:according|based)\s+to\s+(?:my|the)/i.test(query)
        || /(?:search|find|look)\s+(?:in|through|my)\s+(?:notes?|documents?|files?|data)/i.test(query);

      let ragContext = '';
      let notesContext = '';

      if (asksAboutOwnData) {
        const [relevantNotes, ragResults] = await Promise.all([
          semanticSearch(query, 5),
          searchDocuments(query, 5),
        ]);
        ragContext = buildRagContext(ragResults);
        notesContext = relevantNotes.length > 0
          ? relevantNotes.map(n => `Title: ${n.title}\nContent: ${n.content}`).join('\n\n---\n\n')
          : '';
      }

      const systemPrompt = `You are an AI assistant integrated into a personal knowledge graph app.

BEHAVIOR RULES:
1. **Default mode — answer freely from your knowledge.** You are a powerful AI. Answer any question using your full knowledge base. Do NOT restrict yourself to the user's notes or documents unless they explicitly ask.
2. **When user explicitly asks about their data** ("my notes", "from my documents", "what do I have on X", "search my files"): Use the retrieved context provided below to answer. If no relevant context is found, say so.
3. **When user asks to CREATE notes**: Use your full knowledge to generate rich, detailed content freely.
4. **When given web content**: Summarize it into a detailed, well-formatted note.

CRITICAL: The retrieved context (notes/documents) is ONLY provided when the user explicitly asks about their own data. When no context is provided, answer from your general knowledge — do not say "I don't have that information" just because no context was given.

CRITICAL RULES FOR NOTE CONTENT:
- NEVER write "Related Notes", "## Related", "## Connections", "## See Also", or similar footer sections inside note content.
- NEVER append a list of connections/links at the end of a note body.
- To connect notes to each other, use the "linkTo" field in create_note, or use a separate create_link action.
- Use [[Node Title]] ONLY for inline contextual references within prose, not as a footer list.
- Every connection declared must correspond to a note that exists or is being created in the same response.

When writing or editing notes, aggressively use rich Markdown formatting:
- **bold**, *italic*, ~~strikethrough~~ for emphasis
- #, ##, ### for hierarchical headings
- Bulleted lists (-) and numbered lists (1.)
- Task lists (- [ ]) for action items
- \`inline code\` and \`\`\`language code blocks\`\`\` for code
- > Blockquotes for callouts
- [Link Text](https://...) for external links
- [[Node Title]] only for inline contextual references within prose

When you need to perform an action, include a JSON block:

\`\`\`json
[
  { "action": "create_note", "title": "...", "content": "...", "tags": [], "linkTo": ["existing note title if relevant"] }
]
\`\`\`

Available actions: create_note, edit_note, delete_note, create_link, delete_link.
For edit_note include "newContent" or "newTitle". For delete actions include "reason".
Always follow the JSON block with a human-readable explanation.
Only perform actions the user explicitly requested.`;
      
      const contextParts: string[] = [];
      if (ragContext) contextParts.push(`<document_context>\n${ragContext}\n</document_context>`);
      if (notesContext) contextParts.push(`<existing_notes>\n${notesContext}\n</existing_notes>`);

      const userPrompt = contextParts.length > 0
        ? `${contextParts.join('\n\n')}\n\nUser request: ${finalQuery}`
        : `User request: ${finalQuery}`;
      
      let fullResponse = "";
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      await callAI(systemPrompt, userPrompt, (text) => {
        fullResponse = text;
        setAiResponse(text);
      }, abortRef.current.signal);

      const parsed = parseAiResponse(fullResponse);
      if (parsed && parsed.actions.length > 0) {
        setAiResponse(parsed.explanation || "Action proposed:");
        
        const results: { action: AiAction; success: boolean; message: string }[] = [];
        const staged: AiAction[] = [];

        for (const action of parsed.actions) {
          if (action.action === 'create_link' || action.action === 'delete_link') {
            const result = await executeAiAction(action, pageId);
            results.push({ action, success: result.success, message: result.message });
          } else {
            const preflight = await validateActionPreflight(action, pageId);
            if (preflight.blocked) {
              showToast(preflight.message || 'Action blocked', 'error');
            } else {
              staged.push(action);
            }
          }
        }
        setActionResults(results);
        setStagedActions(staged);
      }
      
    } catch (e: unknown) {
      setAiResponse(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleConfirmStaged = async (action: AiAction) => {
    setStagedActions(prev => prev.slice(1));
    const result = await executeAiAction(action, pageId);
    setActionResults(prev => [...prev, { action, success: result.success, message: result.message }]);
    if (result.success) {
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
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
    <>
      <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1060 }} onClick={onClose}>
        <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
          <div className="modal-content glass-panel border-0">
            <div className="modal-header border-0">
              <div className="d-flex align-items-center gap-2" style={{ color: 'var(--accent-gold)' }}>
                <Sparkles size={18} />
                <h5 className="modal-title">Ask AI</h5>
              </div>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" style={{ filter: 'invert(0.7)' }} />
            </div>

            <div className="modal-body">
              {aiResponse !== null ? (
                <div className="ai-response-container" style={{ color: 'var(--text-primary)' }}>
                  {isAiLoading && !aiResponse && <div className="spin-pulse" style={{ color: 'var(--text-secondary)' }}>Analyzing your knowledge graph...</div>}
                  <div className="markdown-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(aiResponse) as string) }} />
                  
                  {actionResults.map((res, i) => (
                    <AiActionCard key={i} result={res} />
                  ))}
                  
                  {!isAiLoading && (
                    <button 
                      className="btn btn-secondary mt-3" 
                      onClick={() => {
                        setAiResponse(null);
                        setQuery('');
                        setActionResults([]);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                    >
                      Ask Another Question
                    </button>
                  )}
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Ask a question, paste a link to research it, or ask me to create/edit notes.
                  </p>
                  
                  <div className="d-flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="What do you want to know?"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <button 
                      className="btn btn-primary d-flex align-items-center justify-content-center flex-shrink-0"
                      onClick={handleAskAi}
                      disabled={!query.trim() || isAiLoading}
                      style={{ width: '48px', height: '48px' }}
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {stagedActions.length > 0 && (
        <ConfirmActionToast 
          action={stagedActions[0]} 
          pageId={pageId}
          onConfirm={() => handleConfirmStaged(stagedActions[0])} 
          onCancel={() => setStagedActions(prev => prev.slice(1))} 
        />
      )}
    </>
  );
};