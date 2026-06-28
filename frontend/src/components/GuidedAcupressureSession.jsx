import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Activity } from "lucide-react";
import { ZONE_CONFIG, POINT_DIAGRAM_TYPE } from "../data/zoneAcupressureConfig";
import FaceTrackedPoint from "./FaceTrackedPoint";
import PoseTrackedPoint from "./PoseTrackedPoint";
import DiagramPoint from "./DiagramPoint";
import "../styles/GuidedSession.css";

// ── Red flag screen ─────────────────────────────────────────────────────────
function RedFlagScreen({ onBack }) {
  return (
    <div className="gs-redflag-root">
      <div className="gs-redflag-icon">🚨</div>
      <h1 className="gs-redflag-title">Please Seek Medical Attention</h1>
      <p className="gs-redflag-body">
        Your reported pain level and pain type suggest a situation that may require
        urgent medical evaluation. Acupressure is not appropriate right now.
      </p>
      <div className="gs-redflag-tel">Emergency: 112 / 911</div>
      <p className="gs-redflag-sub">
        In India, call AIIMS Emergency: 011-26588500
      </p>
      <button className="gs-btn gs-btn--primary gs-redflag-back" onClick={onBack}>
        Return to Dashboard
      </button>
    </div>
  );
}

// ── Session intro card ──────────────────────────────────────────────────────
function SessionIntro({ zone, zoneConfig, primaryPoint, severity, migraineType, migraineConf, onStart, onBack }) {
  const modeLabel = { face: "Face tracking", pose: "Pose tracking", diagram: "Illustrated guide" };
  const modeCls   = { face: "face", pose: "pose", diagram: "diagram" };

  const showLI4Note = severity >= 7 && primaryPoint?.point_id !== "LI4";

  return (
    <div className="gs-intro-root">
      <header className="gs-header">
        <button className="gs-icon-btn" onClick={onBack}><ArrowLeft size={18} /></button>
        <div className="gs-title">
          <span className="gs-title-main">Guided Session</span>
          <span className="gs-title-sub">Acupressure</span>
        </div>
        <div style={{ width: 36 }} />
      </header>

      <main className="gs-intro-main">
        <span className="gs-intro-badge">
          <Activity size={13} strokeWidth={2.5} />
          {zoneConfig?.zoneLabel}
        </span>

        <div>
          <h1 className="gs-intro-zone">{zoneConfig?.zoneLabel}</h1>
          <p className="gs-intro-point">{zoneConfig?.pointName}</p>
        </div>

        <p className="gs-intro-instruction">{zoneConfig?.instruction}</p>

        {zoneConfig && (
          <span className={`gs-intro-mode-badge gs-intro-mode-badge--${modeCls[zoneConfig.mode]}`}>
            {modeLabel[zoneConfig.mode]}
          </span>
        )}

        {migraineType && migraineConf >= 0.5 && (
          <div className="gs-intro-severity-note" style={{ borderColor: "#818cf8", background: "#eef2ff" }}>
            Pattern detected: similar to <strong>{migraineType}</strong> (confidence {Math.round(migraineConf * 100)}%) —
            used to help personalise the suggestions below. This is not a diagnosis.
          </div>
        )}

        {showLI4Note && (
          <div className="gs-intro-severity-note">
            With a severity of {severity}/10 we will also guide you through
            the <strong>Hegu (LI4)</strong> hand point — a powerful pain-relief anchor in TCM.
          </div>
        )}

        {primaryPoint?.reasons?.length > 0 && (
          <div className="gs-point-info">
            <span className="gs-point-code">{primaryPoint.point_id}</span>
            <span className="gs-point-name">{primaryPoint.name_en}</span>
            {primaryPoint.reasons.map((r, i) => (
              <span key={i} className="gs-point-reason">• {r}</span>
            ))}
          </div>
        )}

        <div className="gs-controls">
          <button className="gs-btn gs-btn--primary" onClick={onStart}>
            Begin Session →
          </button>
        </div>

        <p className="gs-intro-disclaimer">
          Not a substitute for professional medical advice. Discontinue if pain worsens.
        </p>
      </main>
    </div>
  );
}

// ── Build secondary-point zoneConfig from recommendation point data ─────────
function buildSecondaryConfig(point) {
  const pid = point.point_id;
  const diagramAlt = POINT_DIAGRAM_TYPE[pid] ?? "generic";
  const instrMap = {
    GB20: "Place both thumbs in the hollows at the base of your skull, on either side of your spine. Apply firm upward pressure for 10 seconds.",
    BL10: "Apply gentle upward pressure at the base of your skull, one finger-width from your spine on each side, for 10 seconds.",
    GB21: "Apply firm downward pressure at the highest point of each shoulder for 10 seconds.",
    LI4:  "Pinch the webbing between your thumb and index finger on the back of your hand. Apply firm pressure for 10 seconds on each hand.",
    PC6:  "Apply gentle pressure three finger-widths above your wrist crease, between the two central tendons, for 10 seconds.",
    SI18: "Apply gentle circular pressure in the hollow directly below your cheekbone for 10 seconds.",
  };

  const label = point.name_en || pid;
  return {
    pointName:   label,
    code:        pid,
    mode:        "diagram",
    zoneLabel:   label,
    instruction: instrMap[pid] || `Apply gentle pressure at ${label} for 10 seconds.`,
    duration:    point.technique?.duration_seconds || 10,
    diagramAlt:  diagramAlt === "generic" ? null : diagramAlt,
    derive:      null,
  };
}

// ── Main component ──────────────────────────────────────────────────────────
export default function GuidedAcupressureSession() {
  const { state }  = useLocation();
  const navigate   = useNavigate();

  // "intro" → "primary" → "secondary-N" → "done"
  const [step, setStep]         = useState("intro");
  const [secIdx, setSecIdx]     = useState(0);

  if (!state?.zone) {
    navigate("/Accudashboard", { replace: true });
    return null;
  }

  const { zone, recommendation, severity, painTypes, assessmentId, migraineType, migraineConf } = state;
  const zoneConfig     = ZONE_CONFIG[zone];
  const redFlag        = recommendation?.redFlag;
  const points         = recommendation?.points || [];
  const primaryPoint   = points[0] || null;
  const secondaryPoints = points.slice(1).filter(p => p.point_id !== primaryPoint?.point_id);

  if (redFlag) {
    return <RedFlagScreen onBack={() => navigate("/Accudashboard")} />;
  }

  if (!zoneConfig) {
    // Unknown zone — show generic diagram
    return (
      <DiagramPoint
        zoneConfig={{
          pointName: zone, code: "", mode: "diagram",
          zoneLabel: zone,
          instruction: "Follow your therapist's instructions for this zone.",
          duration: 30, diagramAlt: null, derive: null,
        }}
        pointData={primaryPoint}
        onComplete={() => navigate("/session-feedback", { state: { recommendation, assessmentId } })}
        onExit={() => navigate("/Accudashboard")}
      />
    );
  }

  // ── Primary point live session ──────────────────────────────────────────
  const handlePrimaryComplete = () => {
    if (secondaryPoints.length > 0) {
      setStep("secondary");
    } else {
      navigate("/session-feedback", { state: { recommendation, assessmentId } });
    }
  };

  if (step === "intro") {
    return (
      <SessionIntro
        zone={zone}
        zoneConfig={zoneConfig}
        primaryPoint={primaryPoint}
        severity={severity}
        migraineType={migraineType}
        migraineConf={migraineConf}
        onStart={() => setStep("primary")}
        onBack={() => navigate(-1)}
      />
    );
  }

  if (step === "primary") {
    const sharedProps = {
      zoneConfig,
      pointData: primaryPoint,
      onComplete: handlePrimaryComplete,
      onExit: () => navigate("/Accudashboard"),
    };

    switch (zoneConfig.mode) {
      case "face":    return <FaceTrackedPoint {...sharedProps} />;
      case "pose":    return <PoseTrackedPoint {...sharedProps} />;
      default:        return <DiagramPoint     {...sharedProps} />;
    }
  }

  if (step === "secondary") {
    const sp = secondaryPoints[secIdx];
    if (!sp) {
      navigate("/session-feedback", { state: { recommendation, assessmentId } });
      return null;
    }

    const secConfig = buildSecondaryConfig(sp);
    const handleSecComplete = () => {
      if (secIdx + 1 < secondaryPoints.length) {
        setSecIdx(i => i + 1);
      } else {
        navigate("/session-feedback", { state: { recommendation, assessmentId } });
      }
    };

    return (
      <DiagramPoint
        zoneConfig={secConfig}
        pointData={sp}
        onComplete={handleSecComplete}
        onExit={() => navigate("/Accudashboard")}
      />
    );
  }

  return null;
}
