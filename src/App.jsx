import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { usePlanner } from './store/PlannerContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Planning from './pages/Planning.jsx';
import FocusStudio from './pages/FocusStudio.jsx';
import Notes from './pages/Notes.jsx';
import GPACalculator from './pages/GPACalculator.jsx';
import Flashcards from './pages/Flashcards.jsx';
import AITutor from './pages/AITutor.jsx';
import StudyTube from './pages/StudyTube.jsx';
import SignIn from './pages/SignIn.jsx';

const NAV_ITEMS = [
  { to: '/',          icon: '󱖒', label: 'Command',    end: true },
  { to: '/planning',  icon: '📅', label: 'Planning' },
  { to: '/focus',     icon: '󱖐', label: 'Focus Studio' },
  { to: '/notes',     icon: '󱖑', label: 'Notes' },
  { to: '/flashcards',icon: '🎴', label: 'Flashcards' },
  { to: '/gpa',       icon: '🎓', label: 'GPA Calc' },
  { to: '/ai',        icon: '󱖔', label: 'Intelligence' },
  { to: '/studytube', icon: '📺', label: 'StudyTube' },
];

export default function App() {
  const { state, updateState } = usePlanner();
  const location = useLocation();

  const doneCount = state.tasks.filter(t => t.done).length;
  const total = state.tasks.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const pageTitle = (() => {
    const path = location.pathname || '/';
    const match = NAV_ITEMS.find((i) => (i.end ? path === i.to : path.startsWith(i.to)));
    return match?.label ?? 'Dashboard';
  })();

  const streak = React.useMemo(() => {
    const doneDates = new Set(state.tasks.filter((t) => t.done && t.deadline).map((t) => t.deadline));
    let count = 0;
    const cur = new Date();
    while (doneDates.has(cur.toISOString().slice(0, 10))) {
      count++;
      cur.setDate(cur.getDate() - 1);
    }
    return count;
  }, [state.tasks]);

  const [clock, setClock] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!state.isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<SignIn />} />
      </Routes>
    );
  }

  return (
    <div className="layout page-fade-in">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-mark">◈</div>
          <h2 className="brand">StudyOS</h2>
        </div>

        <nav className="nav-menu">
          <span className="nav-section-label">Core Systems</span>
          {NAV_ITEMS.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="row" style={{ marginBottom: '1rem', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
              {state.userName?.charAt(0) || 'S'}
            </div>
            <input
              className="user-name-input"
              value={state.userName}
              onChange={e => updateState({ userName: e.target.value })}
              placeholder="Identification..."
              style={{ border: 'none', background: 'transparent', padding: 0, fontWeight: 600, fontSize: '0.85rem' }}
            />
          </div>
          <div className="completion-bar">
            <div className="row-between" style={{ marginBottom: '0.5rem' }}>
              <span className="text-xs muted mono">SYSTEM QUOTA</span>
              <span className="text-xs muted mono">{pct}%</span>
            </div>
            <div className="meter" style={{ height: '4px' }}>
              <div className="meter-fill" style={{ width: `${pct}%`, boxShadow: '0 0 10px var(--accent-glow)' }} />
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Shell ── */}
      <div className="app-shell">
        <header className="header">
          <div className="row" style={{ gap: '1rem' }}>
            <h1 className="font-display" style={{ fontSize: '1.4rem', fontStyle: 'italic' }}>{pageTitle}</h1>
            <div className="badge mono" style={{ opacity: 0.6, fontSize: '0.65rem' }}>v2.4.0-STABLE</div>
          </div>
          <div className="header-right">
            <div className="header-meta mono">{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</div>
            <div className="header-pill">🔥 {streak} DAY STREAK</div>
            <div className="header-pill subtle">◈ {pct}% COMPLETE</div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => updateState({ isAuthenticated: false })}
              title="Terminate Session"
              style={{ padding: '0.5rem', minWidth: '40px' }}
            >
              󱖓
            </button>
          </div>
        </header>

        <main className="content-area">
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/planning"   element={<Planning />} />
            <Route path="/focus"      element={<FocusStudio />} />
            <Route path="/notes"      element={<Notes />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/gpa"        element={<GPACalculator />} />
            <Route path="/ai"         element={<AITutor />} />
            <Route path="/studytube"  element={<StudyTube />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
