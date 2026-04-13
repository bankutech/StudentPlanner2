import React, { useState } from 'react';
import { usePlanner } from '../store/PlannerContext.jsx';

const GRADE_MAP = {
  'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5
};

export default function GPACalculator() {
  const { state, updateState, gainXP } = usePlanner();
  const [form, setForm] = useState({ name: '', grade: 'O', credits: '' });

  function add() {
    if (!form.name.trim() || !form.credits) return;
    const newGrades = [...state.grades, {
      id: Date.now(), name: form.name.trim(),
      val: GRADE_MAP[form.grade], gradeStr: form.grade,
      credits: Number(form.credits)
    }];
    updateState({ grades: newGrades });
    gainXP(30);
    setForm({ name: '', grade: 'O', credits: '' });
  }

  function remove(id) { updateState({ grades: state.grades.filter(g => g.id !== id) }); }

  const cgpa = (() => {
    let pts = 0, cr = 0;
    state.grades.forEach(g => { pts += g.val * g.credits; cr += g.credits; });
    return cr ? (pts / cr).toFixed(2) : null;
  })();

  const cgpaColor = cgpa >= 9 ? 'var(--green)' : cgpa >= 7 ? 'var(--purple-light)' : cgpa >= 5 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div className="gpa-page grid-2" style={{ alignItems: 'start', gap: '1.25rem' }}>
      {/* Input Form */}
      <div className="card">
        <h2>Log Grade</h2>
        <div className="stack">
          <div>
            <div className="label" style={{ marginBottom: '0.4rem' }}>Subject Name</div>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Data Structures & Algorithms" />
          </div>
          <div className="grid-2" style={{ gap: '0.75rem' }}>
            <div>
              <div className="label" style={{ marginBottom: '0.4rem' }}>Grade (SRM Scale)</div>
              <select value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}>
                <option value="O">O — Outstanding (10)</option>
                <option value="A+">A+ — Excellent (9)</option>
                <option value="A">A — Very Good (8)</option>
                <option value="B+">B+ — Good (7)</option>
                <option value="B">B — Above Average (6)</option>
                <option value="C">C — Average (5)</option>
              </select>
            </div>
            <div>
              <div className="label" style={{ marginBottom: '0.4rem' }}>Credits</div>
              <input type="number" min="1" max="6" value={form.credits}
                onChange={e => setForm(p => ({ ...p, credits: e.target.value }))}
                placeholder="e.g. 4" />
            </div>
          </div>
          <button className="btn btn-primary" onClick={add}>+ Log Grade</button>
        </div>

        {/* CGPA Result */}
        {cgpa && (
          <div className="gpa-result">
            <div className="cgpa-value" style={{ color: cgpaColor }}>{cgpa}</div>
            <div className="cgpa-label">Current CGPA (10-point scale)</div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-3)' }}>
              Based on {state.grades.length} subject{state.grades.length !== 1 ? 's' : ''} · {state.grades.reduce((s, g) => s + g.credits, 0)} total credits
            </div>
          </div>
        )}
      </div>

      {/* Grades Table */}
      <div className="card">
        <h2>Grade Sheet</h2>
        {state.grades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎓</div>
            <div>No grades logged yet.<br/>Add a subject to calculate your CGPA.</div>
          </div>
        ) : (
          <table className="gpa-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Grade</th>
                <th>Points</th>
                <th>Credits</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.grades.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 500 }}>{g.name}</td>
                  <td>
                    <span className={`badge ${g.val >= 9 ? 'green' : g.val >= 7 ? '' : 'yellow'}`}>
                      {g.gradeStr || g.val}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: '0.95rem', fontWeight: 700 }}>{g.val}</td>
                  <td className="subtle">{g.credits}</td>
                  <td>
                    <button className="btn-icon danger" onClick={() => remove(g.id)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
