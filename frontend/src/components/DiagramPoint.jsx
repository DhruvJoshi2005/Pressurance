import { useState } from "react";
import { ArrowLeft, Mic } from "lucide-react";
import { useVoiceSequencer } from "../hooks/useVoiceSequencer";
import "../styles/GuidedSession.css";

// ── Inline SVG diagrams ───────────────────────────────────────────────────────

function BackNeckDiagram() {
  return (
    <svg viewBox="0 0 200 280" className="gs-diagram-svg" aria-label="Back of neck acupressure points">
      {/* Head oval (back view) */}
      <ellipse cx="100" cy="85" rx="68" ry="78" fill="none" stroke="#475569" strokeWidth="2" />
      {/* Hair line suggestion */}
      <path d="M 42 100 Q 50 42 100 32 Q 150 42 158 100" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 3"/>
      {/* Neck column */}
      <path d="M 78 158 L 72 230 M 122 158 L 128 230" stroke="#475569" strokeWidth="2" />
      {/* Spine line */}
      <line x1="100" y1="158" x2="100" y2="230" stroke="#334155" strokeWidth="1" strokeDasharray="5 3"/>
      {/* Shoulders */}
      <line x1="32" y1="230" x2="168" y2="230" stroke="#475569" strokeWidth="2"/>
      {/* GB20 points — bilateral, base of skull */}
      <circle cx="76" cy="152" r="9" fill="#3b82f6" opacity="0.85"/>
      <circle cx="124" cy="152" r="9" fill="#3b82f6" opacity="0.85"/>
      <line x1="76" y1="143" x2="52" y2="128" stroke="#60a5fa" strokeWidth="1"/>
      <text x="14" y="125" fill="#93c5fd" fontSize="11" fontFamily="sans-serif">GB20</text>
      <line x1="124" y1="143" x2="148" y2="128" stroke="#60a5fa" strokeWidth="1"/>
      <text x="149" y="125" fill="#93c5fd" fontSize="11" fontFamily="sans-serif">GB20</text>
      {/* BL10 points — closer to spine */}
      <circle cx="88" cy="165" r="7" fill="#6366f1" opacity="0.85"/>
      <circle cx="112" cy="165" r="7" fill="#6366f1" opacity="0.85"/>
      <text x="18" y="192" fill="#a5b4fc" fontSize="10" fontFamily="sans-serif">BL10</text>
      <text x="125" y="192" fill="#a5b4fc" fontSize="10" fontFamily="sans-serif">BL10</text>
      {/* Pressure arrows */}
      <text x="62" y="250" fill="#64748b" fontSize="9" fontFamily="sans-serif">↑ upward pressure ↑</text>
    </svg>
  );
}

function ShoulderDiagram() {
  return (
    <svg viewBox="0 0 240 260" className="gs-diagram-svg" aria-label="Shoulder and neck acupressure points">
      {/* Head */}
      <ellipse cx="120" cy="55" rx="42" ry="50" fill="none" stroke="#475569" strokeWidth="2"/>
      {/* Neck */}
      <path d="M 102 100 L 98 140 M 138 100 L 142 140" stroke="#475569" strokeWidth="2"/>
      {/* Trapezius / shoulder curve */}
      <path d="M 18 155 Q 98 138 120 145 Q 142 138 222 155" stroke="#475569" strokeWidth="2" fill="none"/>
      {/* GB21 dots — midway along shoulder curve */}
      <circle cx="72"  cy="143" r="10" fill="#3b82f6" opacity="0.85"/>
      <circle cx="168" cy="143" r="10" fill="#3b82f6" opacity="0.85"/>
      <line x1="72"  y1="133" x2="52"  y2="118" stroke="#60a5fa" strokeWidth="1"/>
      <text x="6"   y="115" fill="#93c5fd" fontSize="11" fontFamily="sans-serif">GB21</text>
      <line x1="168" y1="133" x2="188" y2="118" stroke="#60a5fa" strokeWidth="1"/>
      <text x="188" y="115" fill="#93c5fd" fontSize="11" fontFamily="sans-serif">GB21</text>
      {/* Arrows */}
      <text x="52" y="175" fill="#64748b" fontSize="9" fontFamily="sans-serif">↓ firm downward ↓</text>
      <text x="22" y="190" fill="#64748b" fontSize="9" fontFamily="sans-serif">(both shoulders)</text>
    </svg>
  );
}

function HandDiagram() {
  return (
    <svg viewBox="0 0 200 220" className="gs-diagram-svg" aria-label="LI4 hand acupressure point">
      {/* Hand outline — dorsum view */}
      <path
        d="M 60 200 L 55 110 Q 54 95 65 88 L 70 60 Q 72 48 80 48 Q 88 48 90 60 L 92 90
           L 94 50 Q 96 38 104 38 Q 112 38 114 50 L 116 88
           L 120 52 Q 122 40 130 40 Q 138 40 140 52 L 140 90
           L 145 65 Q 147 55 154 56 Q 161 57 161 68 L 158 100 L 148 130 Q 145 155 140 200 Z"
        fill="none" stroke="#475569" strokeWidth="2" strokeLinejoin="round"
      />
      {/* Thumb base */}
      <path d="M 60 130 Q 40 110 42 88 Q 44 70 58 72 L 64 88" fill="none" stroke="#475569" strokeWidth="2"/>
      {/* LI4 — web between thumb and index, dorsum */}
      <circle cx="80" cy="108" r="10" fill="#3b82f6" opacity="0.85"/>
      <line x1="80" y1="98" x2="54" y2="78" stroke="#60a5fa" strokeWidth="1"/>
      <text x="6" y="75" fill="#93c5fd" fontSize="12" fontFamily="sans-serif">LI4</text>
      <text x="6" y="90" fill="#64748b" fontSize="9" fontFamily="sans-serif">Hegu</text>
      {/* Instruction */}
      <text x="30" y="215" fill="#64748b" fontSize="8.5" fontFamily="sans-serif">Pinch the web (thumb side)</text>
    </svg>
  );
}

function WristDiagram() {
  return (
    <svg viewBox="0 0 200 200" className="gs-diagram-svg" aria-label="PC6 wrist acupressure point">
      {/* Forearm */}
      <rect x="65" y="20" width="70" height="140" rx="35" fill="none" stroke="#475569" strokeWidth="2"/>
      {/* Wrist crease */}
      <line x1="65" y1="140" x2="135" y2="140" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 3"/>
      {/* PC6 — 3 finger-widths above wrist crease, center */}
      <circle cx="100" cy="118" r="10" fill="#3b82f6" opacity="0.85"/>
      <line x1="100" y1="108" x2="140" y2="80" stroke="#60a5fa" strokeWidth="1"/>
      <text x="140" y="78" fill="#93c5fd" fontSize="12" fontFamily="sans-serif">PC6</text>
      <text x="140" y="93" fill="#64748b" fontSize="9" fontFamily="sans-serif">Neiguan</text>
      {/* Dimension line */}
      <line x1="145" y1="118" x2="145" y2="140" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2"/>
      <text x="148" y="132" fill="#64748b" fontSize="8" fontFamily="sans-serif">~3 fingers</text>
      <text x="22"  y="190" fill="#64748b" fontSize="8.5" fontFamily="sans-serif">Inner wrist, between tendons</text>
    </svg>
  );
}

function GenericDiagram({ pointName, code }) {
  return (
    <div className="gs-diagram-generic">
      <div className="gs-diagram-code">{code}</div>
      <div className="gs-diagram-label">{pointName}</div>
      <p className="gs-diagram-tip">Follow the voice instruction to locate this point.</p>
    </div>
  );
}

const DIAGRAMS = {
  "back-neck": BackNeckDiagram,
  "shoulder":  ShoulderDiagram,
  "hand":      HandDiagram,
  "wrist":     WristDiagram,
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function DiagramPoint({ zoneConfig, pointData, onComplete, onExit }) {
  const { instruction, duration, pointName, code, diagramAlt } = zoneConfig;

  const [phase, setPhase] = useState("ready"); // ready | running | done

  const { status, timeLeft, start, stop } = useVoiceSequencer({
    instruction,
    duration,
    onComplete: () => { setPhase("done"); onComplete?.(); },
  });

  const DiagramComponent = DIAGRAMS[diagramAlt] || null;
  const countLabel = status === "speaking" ? "Listening…" : timeLeft > 0 ? `${timeLeft}s` : null;

  return (
    <div className="gs-root">
      <header className="gs-header">
        <button className="gs-icon-btn" onClick={onExit} title="Exit session">
          <ArrowLeft size={18} />
        </button>
        <div className="gs-title">
          <span className="gs-title-main">{pointName}</span>
          <span className="gs-title-sub">Illustrated guide</span>
        </div>
      </header>

      <main className="gs-main gs-main--diagram">
        <div className="gs-diagram-wrap">
          {DiagramComponent
            ? <DiagramComponent />
            : <GenericDiagram pointName={pointName} code={code} />
          }
        </div>

        {instruction && (
          <div className="gs-caption">
            <Mic size={14} className="gs-caption-icon" />
            <span className="gs-caption-text">{instruction}</span>
            {countLabel && <span className="gs-countdown">{countLabel}</span>}
          </div>
        )}

        {pointData && (
          <div className="gs-point-info">
            <span className="gs-point-code">{pointData.point_id || code}</span>
            <span className="gs-point-name">{pointData.name_en || pointName}</span>
            {pointData.reasons?.length > 0 && (
              <span className="gs-point-reason">{pointData.reasons[0]}</span>
            )}
          </div>
        )}

        <div className="gs-controls">
          {phase === "ready" && (
            <button className="gs-btn gs-btn--primary" onClick={() => { setPhase("running"); start(); }}>
              Start Session
            </button>
          )}
          {phase === "running" && (
            <button className="gs-btn gs-btn--stop" onClick={() => { stop(); setPhase("ready"); }}>
              Pause
            </button>
          )}
          {phase === "done" && (
            <button className="gs-btn gs-btn--primary" onClick={onComplete}>
              Continue →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
