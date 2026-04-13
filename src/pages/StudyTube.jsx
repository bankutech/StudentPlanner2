import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePlanner } from '../store/PlannerContext.jsx';

/* ─── YouTube URL helpers ─── */
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractTitle(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get('v')
      ? `Video ${u.searchParams.get('v').slice(0, 8)}`
      : url.slice(0, 30);
  } catch {
    return url.slice(0, 30) + '…';
  }
}

/* ─── Timestamp helpers ─── */
function secondsToHMS(s) {
  s = Math.floor(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}

function parseTimestamp(text) {
  const m = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const [, a, b, c] = m.map(Number);
  return c !== undefined ? a * 3600 + b * 60 + c : a * 60 + b;
}

/* ─── Render note line: turn [1:23] into clickable chips ─── */
function NoteRenderer({ text, onTimestampClick }) {
  if (!text) return <br />;
  const parts = text.split(/(\[\d{1,2}:\d{2}(?::\d{2})?\])/g);
  return (
    <span>
      {parts.map((part, i) => {
        const inner = part.replace(/^\[|\]$/g, '');
        const secs = parseTimestamp(inner);
        if (secs !== null) {
          return (
            <button key={i} className="st-ts-chip" onClick={() => onTimestampClick(secs)}>
              ⏱ {inner}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

/* ─── YouTube IFrame API hook ─── */
function useYTPlayer(iframeRef, videoId) {
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    playerRef.current = null;
    if (!videoId || !iframeRef.current) return;

    function init() {
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: { onReady: () => setReady(true) },
      });
    }

    if (window.YT?.Player) {
      init();
    } else {
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = init;
    }

    return () => {
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
    };
  }, [videoId]);

  const seekTo = useCallback((secs) => {
    try { playerRef.current?.seekTo(secs, true); } catch {}
  }, []);

  const getCurrentTime = useCallback(() => {
    try { return playerRef.current?.getCurrentTime() ?? 0; } catch { return 0; }
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    try { playerRef.current?.setPlaybackRate(rate); } catch {}
  }, []);

  return { ready, seekTo, getCurrentTime, setPlaybackRate };
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function StudyTube() {
  const { state, addStudyTubeVideo, updateStudyTubeNote, deleteStudyTubeVideo } = usePlanner();

  const [urlInput, setUrlInput]   = useState('');
  const [urlError, setUrlError]   = useState('');
  const [activeVideoId, setActive] = useState(state.studyTube[0]?.videoId || null);
  const [theater, setTheater]     = useState(false);
  const [speed, setSpeed]         = useState(1);
  const [preview, setPreview]     = useState(false);
  const [exportStatus, setExport] = useState('idle'); // 'idle' | 'ok'

  const iframeRef  = useRef(null);
  const textareaRef = useRef(null);
  const { ready, seekTo, getCurrentTime, setPlaybackRate } = useYTPlayer(iframeRef, activeVideoId);

  const active = state.studyTube.find(v => v.videoId === activeVideoId);

  /* Keep selection valid after deletes */
  useEffect(() => {
    if (activeVideoId && state.studyTube.some(v => v.videoId === activeVideoId)) return;
    setActive(state.studyTube[0]?.videoId || null);
  }, [activeVideoId, state.studyTube]);

  /* Sync speed whenever it changes or player becomes ready */
  useEffect(() => {
    if (ready) setPlaybackRate(speed);
  }, [ready, speed, setPlaybackRate]);

  /* ── Add video ── */
  function handleAdd() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    const videoId = extractVideoId(trimmed);
    if (!videoId) {
      setUrlError('Could not parse URL — try https://youtube.com/watch?v=…');
      return;
    }
    setUrlError('');
    if (state.studyTube.some(v => v.videoId === videoId)) {
      setActive(videoId);
      setUrlInput('');
      return;
    }
    addStudyTubeVideo(trimmed, videoId, extractTitle(trimmed));
    setActive(videoId);
    setUrlInput('');
  }

  /* ── Insert current timestamp at cursor ── */
  function handleStamp() {
    if (!active || !ready) return;
    const stamp = `[${secondsToHMS(getCurrentTime())}] `;
    const el  = textareaRef.current;
    const pos = el?.selectionStart ?? (active.notes?.length ?? 0);
    const newVal =
      (active.notes || '').slice(0, pos) +
      stamp +
      (active.notes || '').slice(pos);
    updateStudyTubeNote(active.id, newVal);
    setTimeout(() => {
      el?.focus();
      if (el) el.selectionStart = el.selectionEnd = pos + stamp.length;
    }, 0);
  }

  /* ── Export notes as Markdown ── */
  async function handleExport() {
    if (!active) return;
    const md = [
      `# ${active.title}`,
      `URL: https://youtube.com/watch?v=${active.videoId}`,
      '',
      '## Notes',
      active.notes || '(no notes)',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(md);
    } catch {
      // Clipboard blocked — fall back to file download
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([md], { type: 'text/plain' })),
        download: `${active.title}.md`,
      });
      a.click();
    }
    setExport('ok');
    setTimeout(() => setExport('idle'), 2200);
  }

  /* ═══ RENDER ═══ */
  return (
    <div className={`studytube-page studytube-layout${theater ? ' st-theater' : ''}`}>

      {/* ══ SIDEBAR ══ */}
      <div className="card st-sidebar">
        <h2 className="st-lib-heading">Library</h2>

        <div className="stack-sm">
          <input
            value={urlInput}
            onChange={e => { setUrlInput(e.target.value); setUrlError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Paste YouTube URL…"
          />
          {urlError && <p className="st-url-error">{urlError}</p>}
          <button className="btn btn-primary w-full" onClick={handleAdd}>
            + Add Video
          </button>
        </div>

        <div className="video-list">
          {state.studyTube.length === 0 ? (
            <div className="st-empty">
              No videos yet.<br />Paste a YouTube link above.
            </div>
          ) : (
            state.studyTube.map(v => (
              <div
                key={v.id}
                className={`video-item${v.videoId === activeVideoId ? ' active' : ''}`}
                onClick={() => setActive(v.videoId)}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📹 {v.title}
                </span>
                <button
                  className="btn-icon danger"
                  style={{ flexShrink: 0 }}
                  onClick={e => { e.stopPropagation(); deleteStudyTubeVideo(v.id); }}
                >×</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ══ PLAYER ══ */}
      <div className="player-area">
        {active ? (
          <>
            <iframe
              ref={iframeRef}
              key={active.videoId}
              src={`https://www.youtube.com/embed/${active.videoId}?enablejsapi=1&rel=0&modestbranding=1&color=white`}
              title="StudyTube Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {/* Controls bar */}
            <div className="st-controls">
              <div className="st-speed-group">
                <span className="st-ctrl-label">Speed</span>
                <div className="st-speed-pills">
                  {SPEEDS.map(s => (
                    <button
                      key={s}
                      className={`st-speed-pill${speed === s ? ' active' : ''}`}
                      onClick={() => setSpeed(s)}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>

              <button
                className={`st-ctrl-btn${theater ? ' active' : ''}`}
                onClick={() => setTheater(t => !t)}
              >
                {theater ? '⊠ Exit Theater' : '⊡ Theater'}
              </button>
            </div>
          </>
        ) : (
          <div className="player-empty">
            <div style={{ fontSize: '3.5rem' }}>📺</div>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>No video selected</div>
            <div style={{ fontSize: '0.82rem' }}>Add a YouTube URL from the library panel</div>
          </div>
        )}
      </div>

      {/* ══ NOTES PANEL ══ */}
      <div className="card st-notes-panel">
        {active ? (
          <>
            {/* Toolbar */}
            <div className="st-notes-toolbar">
              <h2 style={{ margin: 0, fontSize: '1rem' }}>Notes</h2>
              <div className="st-notes-actions">
                <button
                  className="st-ctrl-btn"
                  onClick={handleStamp}
                  disabled={!ready}
                  title={ready ? 'Insert current video timestamp' : 'Video not ready yet'}
                >
                  ⏱ Stamp
                </button>
                <button
                  className={`st-ctrl-btn${preview ? ' active' : ''}`}
                  onClick={() => setPreview(p => !p)}
                >
                  {preview ? '✏️ Edit' : '👁 Preview'}
                </button>
                <button
                  className={`st-ctrl-btn${exportStatus === 'ok' ? ' active' : ''}`}
                  onClick={handleExport}
                  title="Copy notes as Markdown"
                >
                  {exportStatus === 'ok' ? '✅ Copied' : '⬆ Export'}
                </button>
              </div>
            </div>

            {/* Active video label */}
            <div className="st-video-label" title={active.title}>
              {active.title}
            </div>

            {/* Inline hint */}
            {!preview && (
              <div className="st-hint">
                Tip: write <code>[1:23]</code> to create a clickable timestamp, or press{' '}
                <strong>⏱ Stamp</strong> to insert the current time.
              </div>
            )}

            {/* Edit */}
            {!preview ? (
              <textarea
                ref={textareaRef}
                className="st-textarea"
                value={active.notes || ''}
                onChange={e => updateStudyTubeNote(active.id, e.target.value)}
                placeholder="Take notes here… timestamps, key concepts, questions…"
              />
            ) : (
              /* Preview — [1:23] tokens become ⏱ chips */
              <div className="st-preview">
                {(active.notes || '').length > 0
                  ? (active.notes || '').split('\n').map((line, i) => (
                      <div key={i} className="st-preview-line">
                        <NoteRenderer text={line} onTimestampClick={seekTo} />
                      </div>
                    ))
                  : <div className="st-empty">No notes yet — switch to Edit to start writing.</div>
                }
              </div>
            )}
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: '0.85rem' }}>Notes</h2>
            <div className="st-empty" style={{ padding: '2rem 0' }}>
              Select a video to start taking notes.
            </div>
          </>
        )}
      </div>
    </div>
  );
}