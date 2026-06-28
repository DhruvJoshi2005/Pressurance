import { useState } from "react";
import { ArrowLeft, Activity, SkipForward } from "lucide-react";

const DURATION_OPTIONS = [
  { value: 1, label: "Less than 1 hour" },
  { value: 2, label: "1 – 24 hours" },
  { value: 3, label: "More than 24 hours" },
];

const BOOL_QUESTIONS = [
  { key: "visual_aura",  label: "Flashing lights or zigzag lines before the pain?" },
  { key: "sensory",      label: "Tingling or numbness before the pain?" },
  { key: "diplopia",     label: "Double vision?" },
  { key: "dysphasia",    label: "Trouble finding words or understanding speech?" },
  { key: "dysarthria",   label: "Slurred speech?" },
  { key: "vertigo",      label: "Dizziness or vertigo?" },
  { key: "tinnitus",     label: "Ringing in the ears?" },
  { key: "hypoacusis",   label: "Sudden hearing loss?" },
  { key: "defect",       label: "Sudden weakness on one side of the body?" },
  { key: "ataxia",       label: "Loss of coordination or balance?" },
];

export default function MigraineAuraCheck({ onBack, onContinue, onSkip }) {
  const [answers, setAnswers] = useState({});
  const [duration, setDuration] = useState("");
  const [frequency, setFrequency] = useState("");

  const toggle = (key, val) =>
    setAnswers(prev => ({ ...prev, [key]: prev[key] === val ? undefined : val }));

  const handleContinue = () => {
    const auraData = {};
    BOOL_QUESTIONS.forEach(({ key }) => {
      if (answers[key] !== undefined) auraData[key] = answers[key];
    });
    if (duration)   auraData.duration  = parseInt(duration);
    if (frequency)  auraData.frequency = parseInt(frequency) || 0;
    onContinue(auraData);
  };

  return (
    <div className="psv-root">
      <header className="psv-header">
        <button className="psv-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="psv-logo">
          <Activity size={18} strokeWidth={2.5} />
          <span>Pressurance</span>
        </div>

        <div className="psv-progress">
          <div className="psv-progress-dot psv-progress-dot--done" />
          <div className="psv-progress-dot psv-progress-dot--active" />
          <div className="psv-progress-dot" />
          <div className="psv-progress-dot" />
          <span style={{ marginLeft: 6 }}>Aura Check</span>
        </div>
      </header>

      <main className="psv-main">
        <div className="psv-card">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: "clamp(1.3rem,2.5vw,1.75rem)", fontWeight: 900, color: "#0d1b2a", marginBottom: 8 }}>
              A few extra questions
            </h1>
            <p style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.6 }}>
              Optional — helps personalise your suggestion. Skip freely if any question
              feels unclear or doesn't apply to you.
            </p>
          </div>

          {/* Episode duration */}
          <div className="psv-slider-section">
            <p className="psv-section-label">How long do your episodes usually last?</p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(duration === String(opt.value) ? "" : String(opt.value))}
                  style={{
                    padding: "0.4rem 0.9rem",
                    borderRadius: 20,
                    border: "1.5px solid",
                    fontSize: "0.83rem",
                    cursor: "pointer",
                    fontWeight: 500,
                    transition: "all 0.15s",
                    borderColor: duration === String(opt.value) ? "#1565c0" : "#d1d5db",
                    background:  duration === String(opt.value) ? "#1565c0" : "#fff",
                    color:       duration === String(opt.value) ? "#fff"    : "#374151",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Episode frequency */}
          <div className="psv-slider-section">
            <p className="psv-section-label">Roughly how many episodes per month?</p>
            <input
              type="number" min="0" max="31"
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              placeholder="e.g. 4"
              style={{
                width: 100, padding: "0.4rem 0.7rem",
                border: "1.5px solid #d1d5db", borderRadius: 8,
                fontSize: "0.92rem", color: "#0d1b2a",
              }}
            />
          </div>

          {/* Boolean aura questions */}
          <div className="psv-slider-section">
            <p className="psv-section-label">Before or during your headache, do you experience:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {BOOL_QUESTIONS.map(({ key, label }) => (
                <div key={key} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.65rem 1rem",
                  background: "#f8faff", borderRadius: 10,
                  border: "1px solid #e5e7eb",
                }}>
                  <span style={{ fontSize: "0.87rem", color: "#374151", flex: 1, marginRight: "1rem" }}>
                    {label}
                  </span>
                  <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                    {[true, false].map(val => (
                      <button
                        key={String(val)}
                        onClick={() => toggle(key, val)}
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: 16,
                          border: "1.5px solid",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          fontWeight: 600,
                          transition: "all 0.15s",
                          borderColor: answers[key] === val
                            ? (val ? "#16a34a" : "#dc2626")
                            : "#d1d5db",
                          background: answers[key] === val
                            ? (val ? "#dcfce7" : "#fee2e2")
                            : "#fff",
                          color: answers[key] === val
                            ? (val ? "#16a34a" : "#dc2626")
                            : "#6b7280",
                        }}
                      >
                        {val ? "Yes" : "No"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={onSkip}
              style={{
                flex: 1, padding: "0.85rem",
                borderRadius: 12, border: "1.5px solid #d1d5db",
                background: "#fff", color: "#6b7280",
                fontWeight: 600, fontSize: "0.93rem",
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <SkipForward size={15} /> Skip
            </button>
            <button
              className="psv-submit-btn"
              onClick={handleContinue}
              style={{ flex: 2 }}
            >
              Continue to Severity
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
