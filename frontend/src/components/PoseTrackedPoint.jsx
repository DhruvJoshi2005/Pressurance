import { useEffect, useRef, useState } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Settings, ArrowLeft, Mic, Video } from "lucide-react";
import { useVoiceSequencer } from "../hooks/useVoiceSequencer";
import DiagramPoint from "./DiagramPoint";
import "../styles/GuidedSession.css";

const WASM_PATH = "/mediapipe-wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

// Minimum visibility score to trust a landmark (0–1 range)
const MIN_VISIBILITY = 0.5;

function drawDot(ctx, x, y, t) {
  const pulse = 1 + Math.sin(t / 380) * 0.22;
  const r     = 15 * pulse;
  ctx.save();
  ctx.shadowBlur  = 28;
  ctx.shadowColor = "#a78bfa";
  ctx.beginPath();
  ctx.arc(x, y, r + 6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(167,139,250,0.18)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#a78bfa";
  ctx.fill();
  ctx.restore();
}

// Check if the landmarks needed by derive() are sufficiently visible.
// Pose mode uses shoulders (11,12) and ears (7,8).
function landmarksVisible(lm) {
  const needed = [7, 8, 11, 12];
  return needed.every(i => lm[i] && (lm[i].visibility ?? 1) > MIN_VISIBILITY);
}

export default function PoseTrackedPoint({ zoneConfig, pointData, onComplete, onExit }) {
  const { instruction, duration, derive, pointName, diagramAlt } = zoneConfig;

  const [phase, setPhase]       = useState("loading"); // loading|ready|running|done|error|fallback
  const [calibMode, setCalibMode] = useState(false);
  const [errMsg, setErrMsg]     = useState("");

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const lmkRef    = useRef(null);
  const streamRef = useRef(null);
  const rafRef    = useRef(null);
  const lastTRef  = useRef(-1);
  const calibRef  = useRef(false);

  const { status, timeLeft, start, stop } = useVoiceSequencer({
    instruction,
    duration,
    onComplete: () => { setPhase("done"); onComplete?.(); },
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        if (cancelled) return;

        const lm = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        if (cancelled) { lm.close(); return; }
        lmkRef.current = lm;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        const video = videoRef.current;
        video.srcObject = stream;
        await new Promise((res, rej) => { video.onloadeddata = res; video.onerror = rej; });
        video.play().catch(() => {});
        if (cancelled) return;

        canvasRef.current.width  = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
        setPhase("ready");

        const loop = (t) => { renderFrame(t); rafRef.current = requestAnimationFrame(loop); };
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        if (!cancelled) {
          // Camera unavailable → fall back to diagram
          setPhase("fallback");
        }
      }
    }

    function renderFrame(t) {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      const lm     = lmkRef.current;
      if (!video || !canvas || !lm || video.readyState < 2) return;
      if (video.currentTime === lastTRef.current) return;
      lastTRef.current = video.currentTime;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const result = lm.detectForVideo(video, performance.now());
      if (!result.poseLandmarks.length) return;

      const landmarks = result.poseLandmarks[0];
      const w = canvas.width;
      const h = canvas.height;

      if (!landmarksVisible(landmarks)) return; // low confidence → don't draw

      if (calibRef.current) {
        ctx.fillStyle = "rgba(250,204,21,0.65)";
        for (const lk of landmarks) {
          if ((lk.visibility ?? 0) > 0.3) {
            ctx.beginPath();
            ctx.arc(lk.x * w, lk.y * h, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      const pt = derive(landmarks, w, h);
      drawDot(ctx, pt.x, pt.y, t);
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      lmkRef.current?.close();
    };
  }, []);

  // Shoulder/neck zones often need user to step back — show a tip
  const [showTip, setShowTip] = useState(true);

  // ── Fallback: if camera failed, render diagram mode ──────────────────────
  if (phase === "fallback") {
    return (
      <DiagramPoint
        zoneConfig={{ ...zoneConfig, mode: "diagram", diagramAlt: diagramAlt || "shoulder" }}
        pointData={pointData}
        onComplete={onComplete}
        onExit={onExit}
      />
    );
  }

  const countLabel = status === "speaking" ? "Listening…" : timeLeft > 0 ? `${timeLeft}s` : null;

  return (
    <div className="gs-root">
      <header className="gs-header">
        <button className="gs-icon-btn" onClick={onExit} title="Exit session">
          <ArrowLeft size={18} />
        </button>
        <div className="gs-title">
          <span className="gs-title-main">{pointName}</span>
          <span className="gs-title-sub">Pose tracking active</span>
        </div>
        <button
          className={`gs-icon-btn ${calibMode ? "gs-icon-btn--active" : ""}`}
          onClick={() => { const n = !calibMode; setCalibMode(n); calibRef.current = n; }}
          title="Calibration overlay"
        >
          <Settings size={17} />
        </button>
      </header>

      <main className="gs-main">
        {showTip && (
          <div className="gs-tip">
            <span>Step back until your shoulders are fully visible</span>
            <button className="gs-tip-close" onClick={() => setShowTip(false)}>✕</button>
          </div>
        )}

        <div className="gs-camera-wrap">
          {phase === "loading" && (
            <div className="gs-overlay">
              <div className="gs-spinner" />
              <p>Loading pose model…</p>
            </div>
          )}

          <video ref={videoRef} autoPlay playsInline muted className="gs-video" />
          <canvas ref={canvasRef} className="gs-canvas gs-canvas--pose" />
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
            <span className="gs-point-code">{pointData.point_id}</span>
            <span className="gs-point-name">{pointData.name_en}</span>
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

        <button
          className="gs-fallback-link"
          onClick={() => setPhase("fallback")}
        >
          Can't see your shoulder? Switch to diagram view
        </button>
      </main>
    </div>
  );
}
