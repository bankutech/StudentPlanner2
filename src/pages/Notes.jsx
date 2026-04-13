import React, { useState } from 'react';
import { usePlanner } from '../store/PlannerContext.jsx';

function markdownToHtml(md) {
  return md
    .replace(/^### (.*)$/gim, '<h3>$1</h3>')
    .replace(/^## (.*)$/gim, '<h2>$1</h2>')
    .replace(/^# (.*)$/gim, '<h1>$1</h1>')
    .replace(/^- (.*)$/gim, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    .replace(/\n\n/g, '<br/><br/>');
}

export default function Notes() {
  const { state, addNote, updateNote } = usePlanner();
  const [activeId, setActiveId] = useState(state.notes[0]?.id || null);
  const [newTitle, setNewTitle] = useState('');

  const active = state.notes.find(n => n.id === activeId);

  return (
    <div className="notes-page notes-layout page-fade-in">
      {/* Sidebar */}
      <div className="card glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem' }}>Notebooks</h2>
        <div className="row" style={{ marginBottom: '1.5rem' }}>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newTitle.trim()) {
                const id = addNote(newTitle.trim());
                setActiveId(id);
                setNewTitle('');
              }
            }}
            placeholder="New title..."
            style={{ flex: 1, borderRadius: '12px' }}
          />
          <button
            className="btn btn-primary"
            style={{ padding: '0.65rem 1rem', borderRadius: '12px' }}
            onClick={() => {
              if (newTitle.trim()) {
                const id = addNote(newTitle.trim());
                setActiveId(id);
                setNewTitle('');
              }
            }}
          >+</button>
        </div>

        <div className="note-list" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {state.notes.map(note => (
            <button
              key={note.id}
              className={`note-btn ${note.id === activeId ? 'active' : ''}`}
              style={{
                padding: '0.9rem 1rem',
                borderRadius: '12px',
                border: note.id === activeId ? '1px solid rgba(124,92,252,0.3)' : '1px solid transparent',
                background: note.id === activeId ? 'var(--surface-active)' : 'transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onClick={() => setActiveId(note.id)}
            >
              <span style={{ marginRight: '8px', opacity: note.id === activeId ? 1 : 0.6 }}>📄</span>
              {note.title}
            </button>
          ))}
          {state.notes.length === 0 && (
            <div style={{ color: 'var(--text-3)', fontSize: '0.87rem', padding: '2rem 0', textAlign: 'center' }}>
              No notes yet
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="card glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        {active ? (
          <>
            <div className="row-between" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>{active.title}</h2>
              <span className="badge">Markdown</span>
            </div>
            <div className="editor-grid" style={{ flex: 1, overflow: 'hidden' }}>
              <textarea
                className="markdown-input"
                style={{ 
                  border: 'none', 
                  borderRadius: 0, 
                  background: 'transparent', 
                  padding: '2rem',
                  fontSize: '1rem',
                  lineHeight: '1.8'
                }}
                value={active.content}
                onChange={e => updateNote(active.id, e.target.value)}
                placeholder="# Start writing…&#10;&#10;Use **bold**, *italic*, `code`, and # headings"
              />
              <div
                className="markdown-preview"
                style={{ 
                  border: 'none', 
                  borderLeft: '1px solid var(--border)', 
                  borderRadius: 0, 
                  background: 'rgba(255,255,255,0.01)',
                  padding: '2rem'
                }}
                dangerouslySetInnerHTML={{ __html: markdownToHtml(active.content) || '<p style="color:var(--text-3); font-style: italic; opacity: 0.5;">Preview will appear here…</p>' }}
              />
            </div>
          </>
        ) : (
          <div className="center" style={{ height: '100%', flexDirection: 'column', gap: '1rem', color: 'var(--text-3)', padding: '4rem' }}>
            <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px rgba(124,92,252,0.15))' }}>📝</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-2)' }}>No note selected</div>
            <div style={{ fontSize: '0.9rem', maxWidth: '280px', textAlign: 'center' }}>Create a new note or select one from the sidebar to begin.</div>
          </div>
        )}
      </div>
    </div>
  );
}
