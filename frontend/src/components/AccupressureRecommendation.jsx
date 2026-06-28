import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, ArrowLeft, MapPin, Clock, ChevronRight } from "lucide-react";
import "../styles/AccupressureRecommendation.css";

const ZONE_LABEL = {
  Temple_Pain: "Temple Pain",
  Mid_Forehead_Pain: "Mid Forehead",
  Forehead_Left: "Left Forehead",
  Forehead_Right: "Right Forehead",
  Ear_Pain: "Ear Pain",
  Skull_Pain: "Top of Skull",
  Back_Neck_Pain: "Back of Neck",
  Jaw_Cheek_Pain: "Jaw / Cheek",
  Neck_Center: "Center Neck",
  Neck_Left: "Left Neck",
  Neck_Right: "Right Neck",
  Shoulder_Left: "Left Shoulder",
  Shoulder_Right: "Right Shoulder",
};

const RANK_BADGE = ["#1", "#2", "#3"];

export default function AccupressureRecommendation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const recommendation = state?.recommendation;

  if (!recommendation) {
    return (
      <div className="rec-root">
        <div className="rec-empty">
          <p>No recommendation data found.</p>
          <button className="rec-back-btn" onClick={() => navigate("/fullbody")}>
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  if (recommendation.redFlag) {
    return (
      <div className="rec-root">
        <header className="rec-header">
          <div className="rec-logo"><Activity size={20} strokeWidth={2.5} /><span>Pressurance</span></div>
        </header>
        <div className="rec-redflag-card">
          <AlertTriangle size={48} color="#ef4444" />
          <h2>Please Seek Medical Attention</h2>
          <p>{recommendation.message}</p>
          <button className="rec-primary-btn" onClick={() => navigate("/Accudashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { points = [], zone, severity, recommendationId } = recommendation;

  return (
    <div className="rec-root">
      <header className="rec-header">
        <button className="rec-header-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div className="rec-logo"><Activity size={20} strokeWidth={2.5} /><span>Pressurance</span></div>
        <div className="rec-zone-badge">{ZONE_LABEL[zone] || zone}</div>
      </header>

      <main className="rec-main">
        <div className="rec-title-block">
          <h1>Your Acupressure Recommendations</h1>
          <p>
            Based on your <strong>{ZONE_LABEL[zone] || zone}</strong> pain with severity{" "}
            <strong>{severity}/10</strong>, here are the top points to try.
          </p>
        </div>

        <div className="rec-cards">
          {points.map((point, i) => (
            <div key={point.point_id} className="rec-card">
              <div className="rec-card-rank">{RANK_BADGE[i]}</div>

              <div className="rec-card-header">
                <div>
                  <h3 className="rec-point-name">{point.name_en}</h3>
                  <span className="rec-point-id">{point.point_id}</span>
                </div>
                <div className="rec-duration">
                  <Clock size={14} />
                  {point.technique?.duration_seconds}s
                </div>
              </div>

              <div className="rec-card-location">
                <MapPin size={14} />
                <span>{point.description}</span>
              </div>

              <div className="rec-card-technique">
                <strong>Technique:</strong>{" "}
                {point.technique?.pressure}, {point.technique?.side} side
              </div>

              <div className="rec-card-why">
                <strong>Why this point:</strong>
                <ul>
                  {point.reasons.map((r, j) => <li key={j}>{r}</li>)}
                </ul>
              </div>

              {point.contraindications?.length > 0 && (
                <div className="rec-card-caution">
                  <AlertTriangle size={13} />
                  {point.contraindications.join(" ")}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          className="rec-primary-btn rec-start-btn"
          onClick={() => navigate("/guided-session", { state: { points, recommendationId } })}
        >
          Start Guided Session <ChevronRight size={18} />
        </button>

        <p className="rec-disclaimer">
          These suggestions are general wellness information based on traditional acupressure
          practice, not a medical diagnosis or treatment. They may help relieve mild discomfort
          but are not a substitute for professional care — please see a doctor for severe,
          sudden, or persistent pain, or if you are pregnant or have a bleeding disorder.
        </p>
      </main>
    </div>
  );
}
