import { useState } from "react";
import { ArrowLeft, Activity, AlertTriangle, Zap, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/PainSeverityView.css";

const SEV_LABEL = (s) => s <= 3 ? "Mild"  : s <= 6 ? "Moderate" : "Severe";
const SEV_CLASS = (s) => s <= 3 ? "mild"   : s <= 6 ? "mod"      : "severe";

export default function PainSeverityView({ onBack, onComplete, symptomsData, painTypeData, auraData, zone }) {
  const [severity, setSeverity]         = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState("");
  const navigate = useNavigate();

  const isHighSeverity = severity >= 8;

  const handleSubmit = async () => {
    setError("");

    // ── Frontend validation (#15) ──────────────────────────────────────────
    const symptoms  = symptomsData?.symptoms || [];
    const painTypes = painTypeData || [];

    if (symptoms.length === 0) {
      setError("Please go back and select at least one symptom before continuing.");
      return;
    }
    if (painTypes.length === 0) {
      setError("Please go back and select at least one pain type before continuing.");
      return;
    }

    setIsSubmitting(true);
    try {
      const painData = {
        symptoms,
        otherSymptom: symptomsData?.other || null,
        painTypes,
        severity,
        bodyPart: symptomsData?.bodyPart || "Head",
      };

      const assessmentRes = await api.post("/pain/assessment", painData);
      const assessmentResult = assessmentRes.data;

      if (zone) {
        const recRes = await api.post("/recommendations/predict", {
          zone,
          painTypes,
          severity,
          auraData: auraData || undefined,
        });

        if (onComplete) onComplete();
        navigate("/session", {
          state: {
            zone,
            recommendation: recRes.data,
            painTypes,
            severity,
            assessmentId:   assessmentResult.assessmentId,
            migraineType:   recRes.data.migraineType    || null,
            migraineConf:   recRes.data.migraineConfidence || null,
          },
        });
        return;
      }

      if (onComplete) onComplete();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg).join(", "));
      } else {
        setError(detail || "Error connecting to server. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const trackPct = ((severity - 1) / 9) * 100;

  return (
    <div className="psv-root">
      {/* Header */}
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
          <div className="psv-progress-dot psv-progress-dot--done" />
          <div className="psv-progress-dot psv-progress-dot--active" />
          <span style={{ marginLeft: 6 }}>Step 3 of 3</span>
        </div>
      </header>

      <main className="psv-main">
        <div className="psv-card">

          {/* Zone info strip */}
          {zone && (
            <div className="psv-zone-info">
              <div className="psv-zone-icon">
                <Zap size={18} />
              </div>
              <div>
                <p className="psv-zone-title">Pain zone</p>
                <p className="psv-zone-name">{zone.replace(/_/g, " ")}</p>
              </div>
            </div>
          )}

          {/* Title */}
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(1.4rem,2.5vw,1.85rem)", fontWeight: 900, color: "#0d1b2a", letterSpacing: "-0.5px", marginBottom: 8 }}>
              Rate your pain severity
            </h1>
            <p style={{ fontSize: "0.93rem", color: "#6b7280", lineHeight: 1.6 }}>
              Move the slider to show how intense your pain feels right now.
            </p>
          </div>

          {/* Validation error banner */}
          {error && (
            <div className="psv-redflag" style={{ background: "#fef2f2", borderColor: "#fca5a5", color: "#991b1b" }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Severity slider section */}
          <div className="psv-slider-section">
            <p className="psv-section-label">Severity Level</p>

            <div className="psv-sev-display">
              <span className="psv-sev-num">{severity}</span>
              <span className={`psv-sev-label psv-sev-label--${SEV_CLASS(severity)}`}>
                {SEV_LABEL(severity)}
              </span>
            </div>

            <input
              type="range" min="1" max="10" value={severity}
              onChange={e => { setSeverity(parseInt(e.target.value)); setError(""); }}
              className="psv-slider"
              style={{
                background: `linear-gradient(90deg, #1565c0 ${trackPct}%, #e5e7eb ${trackPct}%)`,
              }}
            />

            <div className="psv-tick-row">
              <span>1 — No Pain</span>
              <span>5 — Moderate</span>
              <span>10 — Worst</span>
            </div>
          </div>

          {/* Pain type chips (if available) */}
          {painTypeData && painTypeData.length > 0 && (
            <div className="psv-slider-section">
              <p className="psv-section-label">Pain Type Selected</p>
              <div className="psv-pain-types">
                {painTypeData.map(pt => (
                  <span key={pt} className="psv-pain-chip psv-pain-chip--on">{pt}</span>
                ))}
              </div>
            </div>
          )}

          {/* Red flag warning */}
          {isHighSeverity && (
            <div className="psv-redflag">
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                High severity detected. If this pain is sudden, severe, or accompanied by chest tightness or
                numbness, please seek emergency medical attention before proceeding.
              </span>
            </div>
          )}

          {/* Submit */}
          <button className="psv-submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? <><span className="psv-spinner" /> Analysing…</>
              : "Get Acupressure Recommendations"
            }
          </button>
        </div>
      </main>
    </div>
  );
}
