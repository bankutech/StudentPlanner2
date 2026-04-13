import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlanner } from '../store/PlannerContext';

export default function SignIn() {
  const { updateState } = usePlanner();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = (e) => {
    e.preventDefault();
    const finalName = email ? email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) : 'Student';
    updateState({ userName: finalName, isAuthenticated: true });
    navigate('/');
  };

  return (
    <div className="signin-container">
      <div className="signin-glass-card">
        {/* Left Column: Form */}
        <div className="signin-form-col">
          <div className="signin-header">
            <div className="logo-mark" style={{ marginBottom: '1.5rem', width: '48px', height: '48px', fontSize: '1.5rem' }}>◈</div>
            <h1>StudyOS</h1>
            <p>Your elite workspace for academic excellence.</p>
          </div>

          <form onSubmit={handleSignIn} className="stack">
            <div className="input-group stack-sm">
              <label className="label">Access Key (Email)</label>
              <input
                type="email"
                placeholder="Enter email..."
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="input-group stack-sm">
              <label className="label">Security Token (Password)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', color: 'var(--text-3)', fontSize: '1rem'
                  }}
                >
                  {showPassword ? '󱖐' : '󱖑'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '1rem', justifyContent: 'center' }}>
              Initialize Session →
            </button>
          </form>

          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <span className="text-xs muted">SECURE ENCRYPTED ACCESS</span>
          </div>
        </div>

        {/* Right Column: Graphic */}
        <div className="signin-graphic-col">
          <div className="graphic-content">
            <span className="graphic-eyebrow">The Flow State Awaits</span>
            <h2>Master your time. Conquer your goals.</h2>
            
            <div className="graphic-icon">
              ⬡
            </div>
            
            <div className="social-proof">
              <span className="proof-label">Trusted by high-achievers at</span>
              <div className="proof-logos">
                <span className="logo-font">Oxford</span>
                <span className="logo-font">Stanford</span>
                <span className="logo-font">MIT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
