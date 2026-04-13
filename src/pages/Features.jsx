import React from 'react';
import { usePlanner } from '../store/PlannerContext.jsx';
import { FEATURE_SECTIONS } from '../data/features.js';

export default function Features() {
  const { state, updateState } = usePlanner();

  const featureTotal = FEATURE_SECTIONS.reduce((acc, section) => acc + section.items.length, 0);

  return (
    <div className="features-grid max-w">
      <section className="card card-wide shadow-glass header-stat-box">
        <h2>System Feature Architecture</h2>
        <div className="row justify-between align-center mt-sm">
          <p className="subtle font-mono text-sm">
            {state.completedFeatures.length} / {featureTotal} Modules Activated
          </p>
          <div className="meter mid-thick flex-grow ml-gap">
            <span style={{ width: `${(state.completedFeatures.length / featureTotal) * 100}%` }} />
          </div>
        </div>
      </section>

      {FEATURE_SECTIONS.map((section) => (
        <section className="card glass-panel" key={section.category}>
          <h3 className="section-title text-brand mb-gap">{section.category}</h3>
          <div className="stack sm-gap">
            {section.items.map((item) => {
              const checked = state.completedFeatures.includes(item);
              return (
                <label className="row align-center checkbox-row feature-row px-sm py-xs" key={item}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      updateState({
                        completedFeatures: checked
                          ? state.completedFeatures.filter((v) => v !== item)
                          : [...state.completedFeatures, item],
                      })
                    }
                  />
                  <span className={checked ? "strike subtle text-sm block ml-sm" : "text-sm block ml-sm"}>{item}</span>
                </label>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
