import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { X, BrainCircuit } from 'lucide-react';
import { marked } from 'marked';

interface ReviewModalProps {
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ onClose }) => {
  // Query notes that are due for review. If nextReview is undefined or <= Date.now()
  const dueNotes = useLiveQuery(() => 
    db.notes.filter(note => note.nextReview !== undefined && note.nextReview <= Date.now()).toArray()
  ) || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // If we run out of notes to review, we're done
  const isDone = currentIndex >= dueNotes.length;
  const currentNote = dueNotes[currentIndex];

  const handleGrade = async (grade: number) => {
    if (!currentNote || currentNote.id === undefined) return;
    
    // Basic Spaced Repetition Algo (SuperMemo-2 inspired)
    let interval = currentNote.interval || 0;
    let ease = currentNote.ease || 2.5;

    if (grade >= 3) {
      if (interval === 0) interval = 1;
      else if (interval === 1) interval = 6;
      else interval = Math.round(interval * ease);
      ease = ease + 0.1;
    } else if (grade === 2) { // hard
      if (interval === 0) interval = 1;
      else interval = Math.round(interval * 1.2);
      ease = Math.max(1.3, ease - 0.15);
    } else { // again
      interval = 0;
      ease = Math.max(1.3, ease - 0.2);
    }

    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

    await db.notes.update(currentNote.id, { interval, ease, nextReview });
    
    setShowAnswer(false);
    setCurrentIndex(prev => prev + 1);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content review-modal" style={{ maxWidth: '600px', width: '100%' }}>
        <div className="modal-header">
          <h2><BrainCircuit size={20} /> Spaced Repetition Review</h2>
          <button className="icon-btn close-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          {isDone ? (
            <div style={{ textAlign: 'center', margin: 'auto' }}>
              <h3>🎉 You're all caught up!</h3>
              <p>No more flashcards to review right now.</p>
              <button className="primary-btn" onClick={onClose} style={{ marginTop: '20px' }}>Close</button>
            </div>
          ) : (
            <div className="flashcard-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="flashcard-front" style={{ padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>{currentNote.title}</h3>
              </div>
              
              {showAnswer ? (
                <>
                  <div className="flashcard-back" style={{ padding: '20px', backgroundColor: 'var(--bg-card-hover)', borderRadius: '8px', flex: 1, overflowY: 'auto' }}
                       dangerouslySetInnerHTML={{ __html: marked.parse(currentNote.content) as string }} />
                  
                  <div className="flashcard-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
                    <button className="action-btn" onClick={() => handleGrade(1)} style={{ backgroundColor: '#ef4444' }}>Again (1m)</button>
                    <button className="action-btn" onClick={() => handleGrade(2)} style={{ backgroundColor: '#f59e0b' }}>Hard (1.2x)</button>
                    <button className="action-btn" onClick={() => handleGrade(3)} style={{ backgroundColor: '#10b981' }}>Good</button>
                    <button className="action-btn" onClick={() => handleGrade(4)} style={{ backgroundColor: '#3b82f6' }}>Easy</button>
                  </div>
                </>
              ) : (
                <button className="primary-btn" onClick={() => setShowAnswer(true)} style={{ margin: 'auto' }}>Show Answer</button>
              )}
              
              <div style={{ textAlign: 'center', marginTop: '15px', color: 'var(--text-secondary)' }}>
                {currentIndex + 1} of {dueNotes.length} due
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
