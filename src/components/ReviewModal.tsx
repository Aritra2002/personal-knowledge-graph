import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Note } from '../db';
import DOMPurify from 'dompurify';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { marked } from 'marked';

interface ReviewModalProps {
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ onClose }) => {
  const liveDueNotes = useLiveQuery(() => 
    db.notes.filter(note => note.nextReview !== undefined && note.nextReview <= Date.now()).toArray()
  );

  const [reviewQueue, setReviewQueue] = useState<Note[]>([]);
  const [isQueueInitialized, setIsQueueInitialized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (liveDueNotes && !isQueueInitialized) {
      const sorted = [...liveDueNotes].sort((a, b) => (a.nextReview || 0) - (b.nextReview || 0));
      const queue: Note[] = [];
      const remaining = new Set(sorted.map(n => n.id!));
      const noteMap = new Map(sorted.map(n => [n.id!, n]));

      while (remaining.size > 0) {
        let minReview = Infinity;
        let nextId = -1;
        for (const id of remaining) {
          const rev = noteMap.get(id)!.nextReview || 0;
          if (rev < minReview) {
            minReview = rev;
            nextId = id;
          }
        }

        const processQueue = [nextId];
        while (processQueue.length > 0) {
          const id = processQueue.shift()!;
          if (remaining.has(id)) {
            const node = noteMap.get(id)!;
            queue.push(node);
            remaining.delete(id);
            if (node.linkedNoteIds) {
              for (const linkedId of node.linkedNoteIds) {
                if (remaining.has(linkedId)) {
                  processQueue.push(linkedId);
                }
              }
            }
          }
        }
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReviewQueue(queue);
      setIsQueueInitialized(true);
    }
  }, [liveDueNotes, isQueueInitialized]);

  const isDone = isQueueInitialized && currentIndex >= reviewQueue.length;
  const currentNote = reviewQueue[currentIndex];

  const handleGrade = async (grade: number) => {
    if (!currentNote || currentNote.id === undefined) return;
    
    let interval = currentNote.interval || 0;
    let ease = currentNote.ease || 2.5;

    if (grade >= 3) {
      if (interval === 0) interval = 1;
      else if (interval === 1) interval = 6;
      else interval = Math.round(interval * ease);
      ease = ease + 0.1;
    } else if (grade === 2) {
      if (interval === 0) interval = 1;
      else interval = Math.round(interval * 1.2);
      ease = Math.max(1.3, ease - 0.15);
    } else {
      interval = 0;
      ease = Math.max(1.3, ease - 0.2);
    }

    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

    await db.notes.update(currentNote.id, { interval, ease, nextReview });
    
    setShowAnswer(false);
    setCurrentIndex(prev => prev + 1);
  };

  return (
    <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1060 }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-content glass-panel border-0" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
          <div className="modal-header border-0">
            <h5 className="modal-title d-flex align-items-center gap-2"><BrainCircuit size={20} /> Spaced Repetition Review</h5>
            <button type="button" className="btn-close btn-close-overlay" onClick={onClose} aria-label="Close" />
          </div>
          <div className="modal-body" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
            {!isQueueInitialized ? (
              <div className="d-flex align-items-center justify-content-center flex-grow-1">
                <Loader2 className="spinning" size={32} />
              </div>
            ) : isDone ? (
              <div className="text-center my-auto">
                <h3>You're all caught up!</h3>
                <p>No more flashcards to review right now.</p>
                <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '20px' }}>Close</button>
              </div>
            ) : (
              <div className="d-flex flex-column flex-grow-1">
                <div className="p-3 mb-3 rounded" style={{ backgroundColor: 'var(--surface-card, rgba(20, 27, 50, 0.9))' }}>
                  <h3 style={{ marginBottom: '10px' }}>{currentNote.title}</h3>
                </div>
                
                {showAnswer ? (
                  <>
                    <div className="p-3 rounded flex-grow-1 overflow-auto" style={{ backgroundColor: 'var(--surface-glass, rgba(15, 20, 40, 0.75))' }}
                         dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(currentNote.content) as string) }} />
                    
                    <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center">
                      <button className="btn" onClick={() => handleGrade(1)} style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--accent-danger, #ef4444)' }}>Again (1m)</button>
                      <button className="btn" onClick={() => handleGrade(2)} style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--accent-gold, #f59e0b)' }}>Hard (1.2x)</button>
                      <button className="btn" onClick={() => handleGrade(3)} style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)', color: 'var(--node-emerald, #10b981)' }}>Good</button>
                      <button className="btn" onClick={() => handleGrade(4)} style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.4)', color: 'var(--node-indigo, #60a5fa)' }}>Easy</button>
                    </div>
                  </>
                ) : (
                  <button className="btn btn-primary align-self-center mt-auto" onClick={() => setShowAnswer(true)}>Show Answer</button>
                )}
                
                <div className="text-center mt-3" style={{ color: 'var(--text-secondary)' }}>
                  {currentIndex + 1} of {reviewQueue.length} due
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};