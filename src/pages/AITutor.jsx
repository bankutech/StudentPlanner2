import React, { useState, useRef, useEffect } from 'react';
const MODEL = 'gemini-3-flash-preview';

const SYSTEM_PROMPT = "You are StudyOS Intelligence, an elite AI assistant. You are sophisticated, efficient, and precise. Format your responses using clean Markdown.";

export default function AITutor() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      text: 'Session Initialized. ✨\n\nI am your StudyOS Intelligence core. How can I assist your objectives today?'
    }
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const userMessage = input.trim();
    setInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      if (!apiKey) throw new Error("API Key configuration required.");

      const newHistory = [...chatHistory, { role: 'user', text: userMessage }];
      const formattedContents = newHistory.slice(1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const requestBody = {
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: formattedContents
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error?.message || 'API Error');
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
      setChatHistory(prev => [...prev, { role: 'assistant', text }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'error', text: `Critical Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Synthesize the laws of thermodynamics",
    "Analyze the themes in Macbeth",
    "Optimized study plan for LSAT",
    "Explain neural networks using metaphors"
  ];

  return (
    <div className="ai-page page-fade-in">
      <div className="card glass-card" style={{ height: 'calc(100vh - 10rem)', display: 'flex', flexDirection: 'column', gap: '0', padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 2.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'rgba(232, 213, 163, 0.02)' }}>
          <div className="row-between">
            <div>
              <h2 className="font-display" style={{ margin: 0, fontSize: '1.8rem', color: 'var(--accent)' }}>Intelligence</h2>
              <p className="subtle text-xs mono" style={{ marginTop: '0.2rem', opacity: 0.5 }}>CODENAME: {MODEL} • ENCRYPTED SESSION</p>
            </div>
            <div className="row" style={{ gap: '0.75rem' }}>
              <div className="badge" style={{ background: 'rgba(34,211,164,0.05)', color: 'var(--green)' }}>● Systems Nominal</div>
              <button className="btn-icon">󱖔</button>
            </div>
          </div>
        </div>

        {/* Chat Viewport */}
        <div className="chat-viewport" style={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          padding: '2.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.5rem',
          background: 'radial-gradient(circle at 100% 0%, rgba(232,213,163,0.03) 0%, transparent 50%)'
        }}>
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`message-bubble ${msg.role}`}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                padding: '1.25rem 1.75rem',
                borderRadius: msg.role === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #e8d5a3 0%, #c4a159 100%)'
                  : msg.role === 'error'
                    ? 'rgba(235,87,87,0.1)'
                    : 'rgba(255,255,255,0.03)',
                border: msg.role === 'error'
                  ? '1px solid var(--red)'
                  : msg.role === 'user'
                    ? 'none'
                    : '1px solid var(--border)',
                color: msg.role === 'user' ? '#0a0a0a' : 'var(--text)',
                lineHeight: 1.8,
                fontSize: '0.95rem',
                boxShadow: msg.role === 'user' ? '0 10px 30px rgba(232,213,163,0.15)' : 'none',
                animation: 'text-slide-up 0.5s var(--ease) both',
                fontWeight: msg.role === 'user' ? 600 : 400
              }}
            >
              {msg.text}
            </div>
          ))}

          {loading && (
            <div style={{
              alignSelf: 'flex-start', padding: '1.25rem 1.75rem',
              borderRadius: '24px 24px 24px 4px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              display: 'flex',
              gap: '6px'
            }}>
              <div className="dot" style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%', animation: 'pulse-glow 1s infinite alternate' }} />
              <div className="dot" style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%', animation: 'pulse-glow 1s infinite alternate 0.2s' }} />
              <div className="dot" style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%', animation: 'pulse-glow 1s infinite alternate 0.4s' }} />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input & Footer */}
        <div style={{
          padding: '1.5rem 2.5rem 2rem',
          borderTop: '1px solid var(--border)',
          background: 'rgba(10, 10, 10, 0.4)',
          backdropFilter: 'blur(20px)'
        }}>
          {chatHistory.length === 1 && (
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {suggestions.map(s => (
                <button 
                  key={s} 
                  className="btn btn-ghost btn-sm" 
                  style={{ borderRadius: '99px', fontSize: '0.75rem', border: '1px solid rgba(232,213,163,0.2)', background: 'rgba(232,213,163,0.03)', color: 'var(--accent)' }} 
                  onClick={() => setInput(s)}
                >
                  ◈ {s}
                </button>
              ))}
            </div>
          )}
          
          <div className="row" style={{ gap: '1rem' }}>
            <input
              style={{ 
                flexGrow: 1, 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border-bright)',
                padding: '1.1rem 1.5rem',
                borderRadius: '16px',
                fontSize: '1rem'
              }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Query intelligence..."
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              style={{ 
                width: '60px', height: '60px', 
                borderRadius: '16px',
                padding: 0, justifyContent: 'center'
              }}
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? '󱖔' : '→'}
            </button>
          </div>
          <p className="text-xs muted center" style={{ marginTop: '1rem', opacity: 0.3 }}>
            ALL COMMUNICATIONS ARE PROCESSED VIA QUANTUM-SAFE CHANNELS.
          </p>
        </div>
      </div>
    </div>
  );
}
