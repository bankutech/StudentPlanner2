import React, { useState } from 'react';
import { usePlanner } from '../store/PlannerContext.jsx';
import { v4 as uuidv4 } from 'uuid';

export default function Flashcards() {
  const { state, updateState, gainXP } = usePlanner();
  const [qInput, setQInput] = useState('');
  const [aInput, setAInput] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const cards = state.flashcards;
  const active = cards[currentIdx];

  function addCard() {
    if (!qInput.trim() || !aInput.trim()) return;
    const newCards = [...cards, { id: uuidv4(), q: qInput.trim(), a: aInput.trim() }];
    updateState({ flashcards: newCards });
    gainXP(20);
    setQInput('');
    setAInput('');
  }

  function go(dir) {
    if (!cards.length) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx(i => (i + dir + cards.length) % cards.length);
    }, 160);
  }

  function shuffle() {
    if (!cards.length) return;
    setIsFlipped(false);
    setTimeout(() => setCurrentIdx(Math.floor(Math.random() * cards.length)), 160);
  }

  function deleteCard(id) {
    const newCards = cards.filter(c => c.id !== id);
    updateState({ flashcards: newCards });
    setCurrentIdx(0);
    setIsFlipped(false);
  }

  return (
    <div className="flashcards-page grid-2" style={{ alignItems: 'start', gap: '1.25rem' }}>
      {/* Create Card */}
      <div className="card">
        <h2>New Flashcard</h2>
        <div className="stack">
          <div>
            <div className="label" style={{ marginBottom: '0.4rem' }}>Question / Concept</div>
            <input
              value={qInput}
              onChange={e => setQInput(e.target.value)}
              placeholder="e.g. What is Big O notation?"
            />
          </div>
          <div>
            <div className="label" style={{ marginBottom: '0.4rem' }}>Answer / Definition</div>
            <textarea
              value={aInput}
              onChange={e => setAInput(e.target.value)}
              placeholder="e.g. A mathematical notation describing algorithm complexity…"
              rows={4}
            />
          </div>
          <button className="btn btn-primary" onClick={addCard}>
            + Add Card ({cards.length} total)
          </button>
        </div>

        {/* Card List */}
        {cards.length > 0 && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div className="label" style={{ marginBottom: '0.75rem' }}>All Cards</div>
            <div className="stack" style={{ gap: '0.4rem', maxHeight: '280px', overflowY: 'auto' }}>
              {cards.map((c, i) => (
                <div key={c.id} className="row" style={{
                  padding: '0.55rem 0.85rem',
                  background: i === currentIdx ? 'var(--surface-active)' : 'var(--surface)',
                  border: `1px solid ${i === currentIdx ? 'rgba(124,92,252,0.3)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  transition: 'all 0.15s',
                }} onClick={() => { setCurrentIdx(i); setIsFlipped(false); }}>
                  <span style={{ flex: 1, fontSize: '0.83rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.q}</span>
                  <button className="btn-icon danger" onClick={e => { e.stopPropagation(); deleteCard(c.id); }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Deck */}
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Study Deck</h2>

        {cards.length === 0 ? (
          <div style={{ padding: '3rem 1rem', color: 'var(--text-3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎴</div>
            <div>Add your first flashcard to start studying</div>
          </div>
        ) : (
          <>
            {/* Card Counter */}
            <div className="label" style={{ marginBottom: '1rem' }}>
              Card {currentIdx + 1} of {cards.length}
            </div>

            {/* Flashcard */}
            <div className="flashcard-scene" onClick={() => setIsFlipped(f => !f)}>
              <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
                {/* Front */}
                <div className="flashcard-face flashcard-front">
                  <div>
                    <div className="label" style={{ marginBottom: '0.75rem', color: 'var(--purple-light)' }}>Question</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.5 }}>{active?.q}</div>
                    <div className="flip-hint">Click to reveal answer</div>
                  </div>
                </div>
                {/* Back */}
                <div className="flashcard-face flashcard-back">
                  <div>
                    <div className="label" style={{ marginBottom: '0.75rem', color: 'var(--green)' }}>Answer</div>
                    <div style={{ fontSize: '1rem', lineHeight: 1.65, color: 'var(--text)' }}>{active?.a}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="row" style={{ justifyContent: 'center', gap: '0.65rem', marginTop: '1.25rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => go(-1)}>← Prev</button>
              <button className="btn btn-ghost btn-sm" onClick={shuffle}>🔀 Shuffle</button>
              <button className="btn btn-primary btn-sm" onClick={() => go(1)}>Next →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
