import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Settings, ArrowLeft, Mic, Video } from "lucide-react";
import { useVoiceSequencer } from "../hooks/useVoiceSequencer";
import "../styles/GuidedSession.css";

const WASM_PATH  = "/mediapipe-wasm";
const MODEL_URL  = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// Pulsing AR dot drawn on canvas
function drawDot(ctx, x, y, t) {
  const pulse = 1 + Math.sin(t / 380) * 0.22;
  const r     = 15 * pulse;

  ctx.save();
  ctx.shadowBlur  = 28;
  ctx.shadowColor = "#93c5fd";

  ctx.beginPath();
  ctx.arc(x, y, r + 6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(96,165,250,0.18)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#60a5fa";
  ctx.fill();

  ctx.restore();
}

export default function FaceTrackedPoint({ zoneConfig, pointData, onComplete, onExit }) {
  const { instruction, duration, derive, pointName } = zoneConfig;

  const [phase, setPhase]   = useState("loading");  // loading|ready|running|done|error
  const [calibMode, setCalibMode] = useState(false);
  const [errMsg, setErrMsg] = useState("");

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
    onComplete: () => {
      setPhase("done");
      onComplete?.();
    },
  });

  // ── Init landmarker + camera ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        if (cancelled) return;

        const lm = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
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

        const loop = (t) => {
          renderFrame(t);
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        if (!cancelled) { setErrMsg(err.message || "Camera failed."); setPhase("error"); }
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
      if (!result.faceLandmarks.length) return;

      const landmarks = result.faceLandmarks[0];
      const w = canvas.width;
      const h = canvas.height;

      if (calibRef.current) {
        ctx.fillStyle = "rgba(250,204,21,0.65)";
        for (let i = 0; i < landmarks.length; i += 3) {
          ctx.beginPath();
          ctx.arc(landmarks[i].x * w, landmarks[i].y * h, 2.5, 0, Math.PI * 2);
          ctx.fill();
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

  const handleStart = () => {
    setPhase("running");
    start();
  };

  const toggleCalib = () => {
    const next = !calibMode;
    setCalibMode(next);
    calibRef.current = next;
  };

  const countLabel = status === "speaking" ? "Listening…" : timeLeft > 0 ? `${timeLeft}s` : null;

  return (
    <div className="gs-root">
      <header className="gs-header">
        <button className="gs-icon-btn" onClick={onExit} title="Exit session">
          <ArrowLeft size={18} />
        </button>
        <div className="gs-title">
          <span className="gs-title-main">{pointName}</span>
          <span className="gs-title-sub">Face tracking active</span>
        </div>
        <button
          className={`gs-icon-btn ${calibMode ? "gs-icon-btn--active" : ""}`}
          onClick={toggleCalib}
          title="Calibration overlay"
        >
          <Settings size={17} />
        </button>
      </header>

      <main className="gs-main">
        <div className="gs-camera-wrap">
          {phase === "loading" && (
            <div className="gs-overlay">
              <div className="gs-spinner" />
              <p>Loading face model…</p>
            </div>
          )}
          {phase === "error" && (
            <div className="gs-overlay gs-overlay--error">
              <Video size={36} />
              <p><strong>Camera unavailable</strong></p>
              <p className="gs-overlay-sub">{errMsg}</p>
            </div>
          )}

          <video ref={videoRef} autoPlay playsInline muted className="gs-video" />
          <canvas ref={canvasRef} className="gs-canvas" />
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
            <button className="gs-btn gs-btn--primary" onClick={handleStart}>
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

        <p className="gs-disclaimer">
          Glowing dot shows derived landmark position. Use calibration mode to verify accuracy.
        </p>
      </main>
    </div>
  );
}
