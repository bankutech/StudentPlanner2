import React, { useEffect, useState, useRef } from 'react';
import { usePlanner } from '../store/PlannerContext.jsx';

const AMBIENT_SOUNDS = [
  { id: 'lofi', label: 'Lo-Fi', icon: '🎧', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'rain', label: 'Rain', icon: '🌧️', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 'forest', label: 'Forest', icon: '🌲', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
];

export default function FocusStudio() {
  const { state, updateState, addHabit, toggleHabit } = usePlanner();
  const [running, setRunning] = useState(false);
  const [habitInput, setHabitInput] = useState('');
  const [activeSound, setActiveSound] = useState(null);
  const [zenMode, setZenMode] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    let interval = null;
    if (running && state.pomodoroSecondsLeft > 0) {
      interval = setInterval(() => {
        updateState({ pomodoroSecondsLeft: state.pomodoroSecondsLeft - 1 });
      }, 1000);
    } else if (state.pomodoroSecondsLeft === 0) {
      setRunning(false);
      updateState({ focusSeconds: state.focusSeconds + (state.pomodoroMode === 'deep' ? 1500 : 300) });
      new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3').play();
    }
    return () => clearInterval(interval);
  }, [running, state.pomodoroSecondsLeft, state.focusSeconds, state.pomodoroMode, updateState]);

  const toggleSound = (sound) => {
    if (activeSound === sound.id) {
      setActiveSound(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    } else {
      setActiveSound(sound.id);
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(sound.url);
      audioRef.current.loop = true;
      audioRef.current.play();
    }
  };

  const setMode = (mode, minutes) => {
    setRunning(false);
    updateState({ pomodoroMode: mode, pomodoroSecondsLeft: minutes * 60 });
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const fmtTotal = (s) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;

  const modesPct = state.pomodoroMode === 'deep'
    ? ((1500 - state.pomodoroSecondsLeft) / 1500) * 100
    : state.pomodoroMode === 'short'
      ? ((300 - state.pomodoroSecondsLeft) / 300) * 100
      : ((900 - state.pomodoroSecondsLeft) / 900) * 100;

  const MODES = [
    { key: 'deep', label: 'Deep Focus', mins: 25 },
    { key: 'short', label: 'Short Break', mins: 5 },
    { key: 'long', label: 'Long Break', mins: 15 },
  ];

  return (
    <div className={`focus-page ${zenMode ? 'zen-active' : 'focus-layout'} page-fade-in`}>
      {/* ── Main Timer ── */}
      <div className="stack" style={{ gap: '1.5rem', width: zenMode ? '100%' : 'auto', maxWidth: zenMode ? '800px' : 'none', margin: zenMode ? '0 auto' : '0' }}>
        <div className="card glass-card card-glow" style={{ textAlign: 'center', padding: zenMode ? '5rem 2rem' : '3.5rem 2rem' }}>
          <div className="row-between" style={{ marginBottom: '2rem' }}>
            <span className="label" style={{ letterSpacing: '0.2em' }}>
              {state.pomodoroMode === 'deep' ? '◈ FLOW STATE' : '◇ RECUPERATION'}
            </span>
            <button className={`btn btn-sm ${zenMode ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setZenMode(!zenMode)}>
              {zenMode ? '󱖓 Exit Zen' : '󱖒 Zen Mode'}
            </button>
          </div>
          
          <h1 className="timer-display" style={{ fontSize: zenMode ? '12.5rem' : '8.5rem', marginBottom: '1rem', fontStyle: 'normal', fontFamily: 'var(--font-mono)' }}>
            {fmt(state.pomodoroSecondsLeft)}
          </h1>

          <div style={{ margin: '2rem auto', maxWidth: '500px' }}>
            <div className="meter thick" style={{ height: '6px' }}>
              <div className="meter-fill" style={{ 
                width: `${Math.max(0, Math.min(100, modesPct))}%`,
                boxShadow: '0 0 20px var(--accent-glow)'
              }} />
            </div>
            <div className="row-between" style={{ marginTop: '0.75rem' }}>
              <span className="text-xs muted mono">{fmt(state.pomodoroMode === 'deep' ? 1500 - state.pomodoroSecondsLeft : (state.pomodoroMode === 'short' ? 300 - state.pomodoroSecondsLeft : 900 - state.pomodoroSecondsLeft))} elapsed</span>
              <span className="text-xs muted mono">{Math.round(modesPct)}%</span>
            </div>
          </div>

          <div className="row" style={{ justifyContent: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
            {MODES.map(m => (
              <button
                key={m.key}
                className={`btn ${state.pomodoroMode === m.key ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: '99px', padding: '0.6rem 1.5rem' }}
                onClick={() => setMode(m.key, m.mins)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="row" style={{ justifyContent: 'center', gap: '1.25rem' }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ minWidth: '220px', fontSize: '1.2rem', padding: '1.1rem' }}
              onClick={() => setRunning(r => !r)}
            >
              {running ? '󱖗 Pause' : '󱖖 Begin'}
            </button>
            <button
              className="btn btn-ghost"
              style={{ padding: '1.1rem', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setMode(state.pomodoroMode, state.pomodoroMode === 'deep' ? 25 : state.pomodoroMode === 'short' ? 5 : 15)}
            >
              ↺
            </button>
          </div>
        </div>

        {/* Ambient Tools */}
        <div className="grid-2">
          <div className="card glass-card">
            <span className="label" style={{ display: 'block', marginBottom: '1.5rem' }}>Atmosphere</span>
            <div className="row" style={{ gap: '0.75rem' }}>
              {AMBIENT_SOUNDS.map(s => (
                <button
                  key={s.id}
                  className={`btn ${activeSound === s.id ? 'btn-primary' : 'btn-ghost'} flex-1`}
                  style={{ flexDirection: 'column', padding: '1rem', gap: '0.5rem' }}
                  onClick={() => toggleSound(s)}
                >
                  <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                  <span className="text-xs bold">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card glass-card">
            <span className="label" style={{ display: 'block', marginBottom: '1rem' }}>Accumulated Focus</span>
            <div className="font-display" style={{ fontSize: '3rem', color: 'var(--accent)' }}>{fmtTotal(state.focusSeconds)}</div>
            <p className="text-xs muted mono" style={{ marginTop: '0.5rem' }}>Total study time recorded</p>
          </div>
        </div>
      </div>

      {!zenMode && (
        <div className="card glass-card" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>Core Habits</h2>
          <div className="row" style={{ marginBottom: '2.5rem' }}>
            <input
              value={habitInput}
              onChange={e => setHabitInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && habitInput) { addHabit(habitInput); setHabitInput(''); } }}
              placeholder="Define new standard..."
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" style={{ width: '50px', height: '50px' }} onClick={() => { if (habitInput) { addHabit(habitInput); setHabitInput(''); } }}>+</button>
          </div>

          <div className="stack" style={{ gap: '0.85rem' }}>
            {state.habits.map(habit => (
              <div
                key={habit.id}
                className="task-item"
                style={{ background: habit.done ? 'var(--surface-active)' : 'var(--surface)', borderColor: habit.done ? 'var(--accent-dim)' : 'var(--border)' }}
                onClick={() => toggleHabit(habit.id)}
              >
                <div className={`check-ring ${habit.done ? 'checked' : ''}`} style={{ marginTop: '0' }}>
                  {habit.done ? '✓' : ''}
                </div>
                <span style={{
                  flex: 1,
                  fontWeight: 500,
                  textDecoration: habit.done ? 'line-through' : 'none',
                  opacity: habit.done ? 0.5 : 1,
                }}>
                  {habit.name}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '3rem', padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <div className="row-between" style={{ marginBottom: '1rem' }}>
              <span className="label">Performance</span>
              <span className="mono bold" style={{ color: 'var(--accent)' }}>{Math.round((state.habits.filter(h => h.done).length / (state.habits.length || 1)) * 100)}%</span>
            </div>
            <div className="meter thick">
              <div className="meter-fill" style={{
                width: state.habits.length ? `${(state.habits.filter(h => h.done).length / state.habits.length) * 100}%` : '0%',
                boxShadow: '0 0 15px var(--accent-glow)'
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
