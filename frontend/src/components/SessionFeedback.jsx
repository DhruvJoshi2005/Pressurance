import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react";
import api from "../utils/api";
import "../styles/SessionFeedback.css";

export default function SessionFeedback() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const points = state?.points || [];
  const recommendationId = state?.recommendationId || "";

  const [feedback, setFeedback] = useState({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (pointId, helped) => {
    setFeedback((prev) => ({
      ...prev,
      [pointId]: prev[pointId] === helped ? undefined : helped,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const entries = points.map((p) => ({
      recommendationId,
      pointId: p.point_id,
      helped: feedback[p.point_id] ?? false,
      notes: notes.trim() || null,
    }));

    try {
      await Promise.all(
        entries.map((entry) => api.post("/recommendations/feedback", entry))
      );
      setSubmitted(true);
    } catch (err) {
      console.error("Feedback error:", err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="sf-root">
        <div className="sf-success">
          <CheckCircle2 size={56} color="#16a34a" />
          <h2>Thank you for your feedback!</h2>
          <p>Your input helps improve future recommendations.</p>
          <button className="sf-done-btn" onClick={() => navigate("/Accudashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sf-root">
      <header className="sf-header">
        <div className="sf-logo"><Activity size={20} strokeWidth={2.5} /><span>Pressurance</span></div>
      </header>

      <main className="sf-main">
        <div className="sf-title-block">
          <h1>How did your session go?</h1>
          <p>Let us know which points felt helpful. This improves future recommendations.</p>
        </div>

        <div className="sf-cards">
          {points.map((point) => {
            const vote = feedback[point.point_id];
            return (
              <div key={point.point_id} className="sf-card">
                <div className="sf-card-left">
                  <span className="sf-point-name">{point.name_en}</span>
                  <span className="sf-point-id">{point.point_id}</span>
                </div>
                <div className="sf-vote-btns">
                  <button
                    className={`sf-vote-btn sf-yes ${vote === true ? "sf-vote-active-yes" : ""}`}
                    onClick={() => toggle(point.point_id, true)}
                    aria-label="Helped"
                  >
                    <ThumbsUp size={18} />
                  </button>
                  <button
                    className={`sf-vote-btn sf-no ${vote === false ? "sf-vote-active-no" : ""}`}
                    onClick={() => toggle(point.point_id, false)}
                    aria-label="Didn't help"
                  >
                    <ThumbsDown size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="sf-notes">
          <label htmlFor="sf-notes-input">Any additional notes? (optional)</label>
          <textarea
            id="sf-notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. GB20 gave instant relief, TAIYANG felt too sensitive..."
            rows={3}
          />
        </div>

        <button
          className="sf-submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Submit Feedback"}
        </button>

        <button className="sf-skip-link" onClick={() => navigate("/Accudashboard")}>
          Skip and go to dashboard
        </button>
      </main>
    </div>
  );
}
