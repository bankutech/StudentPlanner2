import React, { useState, useMemo, useEffect, useRef } from 'react';
import { usePlanner } from '../store/PlannerContext.jsx';
import Chart from 'chart.js/auto';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// Circular SVG Progress Ring
function ProgressRing({ pct = 0, size = 100, stroke = 8, color = 'var(--accent)' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.19, 1, 0.22, 1)' }} />
    </svg>
  );
}

export default function Dashboard() {
  const { state, addTask, toggleTask, deleteTask, addSubject, rescheduleMissedTasks } = usePlanner();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const [form, setForm] = useState({
    title: '', day: (new Date().getDay() + 6) % 7,
    subject: state.subjects[0] || 'General', priority: 'medium',
    deadline: new Date().toISOString().slice(0, 10), recurring: 'none',
  });
  const [subjectInput, setSubjectInput] = useState('');

  const todayIdx = (new Date().getDay() + 6) % 7;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const doneCount = state.tasks.filter(t => t.done).length;
  const total = state.tasks.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const pendingToday = state.tasks.filter(t => !t.done && t.deadline === todayStr).length;
  const overdue = state.tasks.filter(t => !t.done && t.deadline < todayStr).length;

  const streak = useMemo(() => {
    const doneDates = new Set(state.tasks.filter(t => t.done && t.deadline).map(t => t.deadline));
    let count = 0;
    const cur = new Date();
    while (doneDates.has(cur.toISOString().slice(0, 10))) {
      count++;
      cur.setDate(cur.getDate() - 1);
    }
    return count;
  }, [state.tasks]);

  const weekStats = useMemo(() =>
    DAYS.map((label, idx) => {
      const tasks = state.tasks.filter(t => Number(t.day) === idx);
      const done = tasks.filter(t => t.done).length;
      return { label, done, total: tasks.length, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
    }), [state.tasks]);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();
      
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: DAYS,
          datasets: [{
            label: 'Completion Rate',
            data: weekStats.map(d => d.pct),
            borderColor: '#e8d5a3',
            background: 'rgba(232, 213, 163, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#e8d5a3'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { display: false, min: 0, max: 100 },
            x: { grid: { display: false }, ticks: { color: '#6e6b66', font: { size: 10, family: 'JetBrains Mono' } } }
          }
        }
      });
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [weekStats]);

  function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    addTask(form);
    setForm(p => ({ ...p, title: '' }));
  }

  return (
    <div className="dashboard-page stack" style={{ gap: '1.5rem' }}>

      {/* ── Hero Banner ── */}
      <div className="dash-hero">
        <div className="dash-hero-pattern" />
        
        <div className="dash-hero-content">
          <div className="dash-hero-eyebrow">
            {FULL_DAYS[todayIdx]}, {MONTHS[now.getMonth()]} {now.getDate()}
          </div>
          <h1 className="dash-hero-title">
            {getGreeting()}, <span className="brand">{state.userName}</span>
          </h1>
          <p className="dash-hero-subtitle">
            {pendingToday === 0
              ? "Your schedule is immaculate. Everything is under control. ✨"
              : `Operational status: ${pendingToday} objective${pendingToday !== 1 ? 's' : ''} require your attention today.`}
          </p>
        </div>

        <div className="dash-hero-ring">
          <div className="dash-hero-ring-inner">
            <ProgressRing pct={pct} size={110} stroke={6} color="var(--accent)" />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div className="font-display" style={{ fontSize: '1.8rem', color: 'white', lineHeight: 1 }}>{pct}%</div>
              <div className="label" style={{ fontSize: '0.55rem', marginTop: '2px' }}>Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-3">
        {[
          { label: 'Pending Today', value: pendingToday, icon: '◈', color: 'var(--accent)', bg: 'rgba(232,213,163,0.06)', border: 'rgba(232,213,163,0.15)' },
          { label: 'Overdue Briefs', value: overdue, icon: '⚠', color: 'var(--red)', bg: 'rgba(235,87,87,0.06)', border: 'rgba(235,87,87,0.15)' },
          { label: 'Total Complete', value: doneCount, icon: '✓', color: 'var(--green)', bg: 'rgba(111,207,151,0.06)', border: 'rgba(111,207,151,0.15)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ background: s.bg, borderColor: s.border }}>
            <div className="row-between">
              <span className="stat-label">{s.label}</span>
              <span style={{ color: s.color, opacity: 0.6 }}>{s.icon}</span>
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1fr) 400px', alignItems: 'start' }}>
        {/* Weekly Pulse Chart */}
        <div className="card" style={{ height: '360px' }}>
          <div className="row-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Weekly Pulse</h2>
            <div className="badge">{streak} Day Streak 🔥</div>
          </div>
          <div style={{ flex: 1, position: 'relative', height: '240px' }}>
            <canvas ref={chartRef} />
          </div>
        </div>

        {/* Task Entry */}
        <div className="card">
          <h2>Deploy Task</h2>
          <form onSubmit={handleAdd} className="stack">
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="What is the objective?"
            />
            <div className="grid-2" style={{ gap: '0.5rem' }}>
              <select value={form.day} onChange={e => setForm(p => ({ ...p, day: Number(e.target.value) }))}>
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <div className="row">
              <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>Deploy</button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Task Queue ── */}
      <div className="card">
        <div className="row-between" style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0 }}>Task Queue</h2>
          <button className="btn btn-ghost btn-sm" onClick={rescheduleMissedTasks}>↺ Sync Missed</button>
        </div>
        <div className="grid-auto">
          {total === 0 && (
            <div className="span-full center" style={{ flexDirection: 'column', gap: '1rem', padding: '4rem', opacity: 0.5 }}>
              <span style={{ fontSize: '3rem' }}>✧</span>
              <p className="font-display">The queue is currently empty. Clear for action.</p>
            </div>
          )}
          {state.tasks.map(task => (
            <div key={task.id} className={`task-item priority-${task.priority} ${task.done ? 'done' : ''}`} onClick={() => toggleTask(task.id)}>
              <div className="priority-bar" />
              <div className={`check-ring ${task.done ? 'checked' : ''}`}>
                {task.done ? '✓' : ''}
              </div>
              <div className="flex-1">
                <div className="task-title">{task.title}</div>
                <div className="row" style={{ marginTop: '0.4rem', gap: '0.5rem' }}>
                  <span className="badge">{task.subject}</span>
                  <span className="text-xs muted">{task.deadline}</span>
                </div>
              </div>
              <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}>×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
