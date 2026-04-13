import React, { useMemo, useState } from 'react';
import { usePlanner } from '../store/PlannerContext.jsx';
import { v4 as uuidv4 } from 'uuid';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function parseDeadlineParts(deadline) {
  if (!deadline || typeof deadline !== 'string') return null;
  const parts = deadline.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  return { y, m, d };
}

function buildMonthMatrix(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const firstDay = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return { cells };
}

export default function Planning() {
  const { state, updateState } = usePlanner();
  const [dragFrom, setDragFrom] = useState(null);
  const [newBlock, setNewBlock] = useState({ label: '', time: '' });

  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const today = now.getDate();

  const { cells } = useMemo(() => buildMonthMatrix(year, monthIndex), [year, monthIndex]);

  const tasksInViewMonth = useMemo(() => {
    return state.tasks.filter((t) => {
      const p = parseDeadlineParts(t.deadline);
      return p && p.y === year && p.m === monthIndex + 1;
    });
  }, [state.tasks, year, monthIndex]);

  const tasksOnDay = useMemo(() => {
    const map = {};
    tasksInViewMonth.forEach((t) => {
      const p = parseDeadlineParts(t.deadline);
      if (!p) return;
      if (!map[p.d]) map[p.d] = [];
      map[p.d].push(t);
    });
    return map;
  }, [tasksInViewMonth]);

  function moveBlock(fromIdx, toIdx) {
    if (fromIdx == null || fromIdx === toIdx) return;
    const blocks = [...state.timeBlocks];
    const [item] = blocks.splice(fromIdx, 1);
    blocks.splice(toIdx, 0, item);
    updateState({ timeBlocks: blocks });
  }

  return (
    <div className="planning-page stack" style={{ gap: '1.5rem' }}>

      {/* Monthly calendar */}
      <div className="card glass-card card-glow">
        <div className="row-between" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h2 className="font-display" style={{ margin: 0, fontSize: '2.4rem' }}>
              {MONTH_NAMES[monthIndex]} <span className="text-xs muted mono" style={{ verticalAlign: 'middle', marginLeft: '0.5rem' }}>PERIOD {year}</span>
            </h2>
          </div>
          <div className="badge" style={{ padding: '0.5rem 1rem' }}>
            {tasksInViewMonth.length} SCHEDULED OBJECTIVES
          </div>
        </div>

        <div className="calendar-grid">
          {DAYS.map(d => (
            <div key={d} className="calendar-head" style={{ border: 'none', color: 'var(--accent)', opacity: 0.6 }}>{d}</div>
          ))}
          {cells.map((cell, idx) => {
            const tasks = cell ? (tasksOnDay[cell] || []) : [];
            const isToday = cell === today;
            return (
              <div
                key={`cell-${idx}`}
                className={`calendar-cell ${cell ? 'active' : ''}`}
                style={{ 
                  borderColor: isToday ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                  background: isToday ? 'rgba(232,213,163,0.04)' : undefined
                }}
              >
                {cell && (
                  <>
                    <div className="cal-date" style={{ fontWeight: isToday ? 800 : 400, color: isToday ? 'var(--accent)' : 'var(--text-3)' }}>
                      {cell}
                    </div>
                    {tasks.slice(0, 2).map(t => (
                      <div key={t.id} style={{
                        marginTop: '3px', fontSize: '0.6rem', padding: '2px 6px',
                        background: t.done ? 'var(--green-bg)' : 'rgba(232,213,163,0.08)',
                        color: t.done ? 'var(--green)' : 'var(--accent)',
                        borderRadius: '4px', border: `1px solid ${t.done ? 'rgba(34,211,164,0.2)' : 'rgba(232,213,163,0.2)'}`,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {t.title}
                      </div>
                    ))}
                    {tasks.length > 2 && (
                      <div style={{ fontSize: '0.55rem', color: 'var(--text-3)', marginTop: '4px', textAlign: 'center' }}>+{tasks.length - 2} MORE</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1fr) 380px', alignItems: 'start' }}>

        <div className="card glass-card">
          <h2 className="font-display">Daily Protocol</h2>
          <p className="text-xs muted" style={{ marginBottom: '1.5rem', marginTop: '-0.5rem' }}>RECURRING OPERATIONAL SCHEDULE</p>
          
          <div className="row" style={{ marginBottom: '1.5rem', gap: '0.75rem' }}>
            <input value={newBlock.label} onChange={e => setNewBlock(p => ({ ...p, label: e.target.value }))}
              placeholder="Objective (e.g. Deep Work)" style={{ flex: 2 }} />
            <input value={newBlock.time} onChange={e => setNewBlock(p => ({ ...p, time: e.target.value }))}
              placeholder="Time-frame" style={{ flex: 1 }} />
            <button type="button" className="btn btn-primary" onClick={() => {
              if (!newBlock.label || !newBlock.time) return;
              updateState({ timeBlocks: [...state.timeBlocks, { id: uuidv4(), ...newBlock }] });
              setNewBlock({ label: '', time: '' });
            }}>Deploy</button>
          </div>

          <div className="stack" style={{ gap: '0.65rem' }}>
            {state.timeBlocks.map((block, idx) => (
              <div
                key={block.id}
                className="time-block-item"
                draggable
                onDragStart={() => setDragFrom(idx)}
                onDragEnd={() => setDragFrom(null)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => {
                  if (dragFrom == null) return;
                  moveBlock(dragFrom, idx);
                  setDragFrom(null);
                }}
                style={{ 
                  opacity: dragFrom === idx ? 0.5 : 1,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)'
                }}
              >
                <div className="drag-handle" style={{ opacity: 0.3 }}>󱖒</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{block.label}</div>
                  <div className="time-label" style={{ color: 'var(--accent)', opacity: 0.7 }}>{block.time}</div>
                </div>
                <button type="button" className="btn-icon danger" onClick={() => updateState({ timeBlocks: state.timeBlocks.filter(b => b.id !== block.id) })}>×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card glass-card">
          <h2 className="font-display">Strategic Intent</h2>
          <textarea
            className="mission-textarea"
            value={state.semesterGoal}
            onChange={e => updateState({ semesterGoal: e.target.value })}
            placeholder="Define your primary objective for this term..."
            rows={8}
            style={{ fontSize: '1.1rem', fontStyle: 'italic', background: 'transparent', border: 'none', padding: 0 }}
          />
          <p className="text-xs muted mono" style={{ marginTop: '1.5rem', textAlign: 'right', opacity: 0.5 }}>TERMINAL INPUT v1.0</p>
        </div>
      </div>
    </div>
  );
}
