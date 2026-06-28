import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, MapPin, ChevronRight, SkipForward } from "lucide-react";
import "../styles/SimpleGuidedSession.css";

export default function SimpleGuidedSession() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const points = state?.points || [];
  const recommendationId = state?.recommendationId;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  const currentPoint = points[currentIndex];
  const totalDuration = currentPoint?.technique?.duration_seconds || 60;

  useEffect(() => {
    setSecondsLeft(totalDuration);
    setRunning(false);
    setDone(false);
    clearInterval(intervalRef.current);
  }, [currentIndex, totalDuration]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleStart = () => {
    setSecondsLeft(totalDuration);
    setDone(false);
    setRunning(true);
  };

  const handleSkip = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    advance();
  };

  const handleNext = () => advance();

  const advance = () => {
    if (currentIndex < points.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      navigate("/session-feedback", { state: { points, recommendationId } });
    }
  };

  if (!currentPoint) {
    return (
      <div className="gs-root">
        <p className="gs-empty">No session data. <button onClick={() => navigate("/fullbody")}>Go back</button></p>
      </div>
    );
  }

  const progress = secondsLeft === null ? 1 : secondsLeft / totalDuration;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * progress;
  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeDisplay = `${minutes > 0 ? `${minutes}m ` : ""}${secs}s`;

  return (
    <div className="gs-root">
      <header className="gs-header">
        <div className="gs-logo"><Activity size={20} strokeWidth={2.5} /><span>Pressurance</span></div>
        <div className="gs-progress-label">
          Point {currentIndex + 1} of {points.length}
        </div>
      </header>

      <div className="gs-progress-bar">
        <div
          className="gs-progress-fill"
          style={{ width: `${((currentIndex) / points.length) * 100}%` }}
        />
      </div>

      <main className="gs-main">
        <div className="gs-card">
          <div className="gs-point-meta">
            <h2 className="gs-point-name">{currentPoint.name_en}</h2>
            <span className="gs-point-id">{currentPoint.point_id}</span>
          </div>

          <div className="gs-location">
            <MapPin size={15} />
            <span>{currentPoint.description}</span>
          </div>

          <div className="gs-technique">
            <strong>How to apply:</strong> {currentPoint.technique?.pressure},{" "}
            {currentPoint.technique?.side} side — hold for {totalDuration} seconds.
          </div>

          {/* Circular timer */}
          <div className="gs-timer-wrap">
            <svg className="gs-timer-svg" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" className="gs-circle-bg" />
              <circle
                cx="60" cy="60" r="54"
                className="gs-circle-progress"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: running ? "stroke-dashoffset 1s linear" : "none" }}
              />
            </svg>
            <div className="gs-timer-inner">
              {done ? (
                <span className="gs-timer-done">Done!</span>
              ) : (
                <span className="gs-timer-count">{timeDisplay}</span>
              )}
            </div>
          </div>

          <div className="gs-actions">
            {!running && !done && (
              <button className="gs-btn gs-btn-primary" onClick={handleStart}>
                {secondsLeft === totalDuration ? "Start Timer" : "Resume"}
              </button>
            )}
            {running && (
              <button className="gs-btn gs-btn-secondary" onClick={handleSkip}>
                <SkipForward size={16} /> Skip
              </button>
            )}
            {done && (
              <button className="gs-btn gs-btn-primary" onClick={handleNext}>
                {currentIndex < points.length - 1 ? <>Next Point <ChevronRight size={16} /></> : "Finish Session"}
              </button>
            )}
          </div>

          {!running && !done && secondsLeft < totalDuration && (
            <button className="gs-skip-link" onClick={handleSkip}>
              Skip this point
            </button>
          )}
        </div>

        {/* Upcoming points preview */}
        {currentIndex < points.length - 1 && (
          <div className="gs-upcoming">
            <p className="gs-upcoming-label">Up next</p>
            {points.slice(currentIndex + 1).map((p, i) => (
              <div key={p.point_id} className="gs-upcoming-item">
                <span className="gs-upcoming-num">{currentIndex + 2 + i}</span>
                <span className="gs-upcoming-name">{p.name_en}</span>
                <span className="gs-upcoming-dur">{p.technique?.duration_seconds}s</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
