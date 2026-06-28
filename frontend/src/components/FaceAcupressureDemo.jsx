import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, Settings, Mic, Video } from "lucide-react";
import "../styles/FaceAcupressureDemo.css";

// Local WASM served from public/ — avoids CDN version mismatch
const WASM_PATH = "/mediapipe-wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// ── Hardcoded demo sequence (no backend needed) ──────────────────────────────
const DEMO_POINTS = [
  {
    id: "yintang",
    label: "Yintang — Third Eye Point",
    instruction:
      "Apply gentle, steady pressure between your eyebrows for 10 seconds.",
    duration: 10,
  },
  {
    id: "taiyang_l",
    label: "Taiyang — Left Temple",
    instruction:
      "Press lightly in a small circular motion on your left temple for 10 seconds.",
    duration: 10,
  },
  {
    id: "taiyang_r",
    label: "Taiyang — Right Temple",
    instruction:
      "Now apply the same gentle circular motion on your right temple for 10 seconds.",
    duration: 10,
  },
];

// Calibration: indices to label in debug overlay
const CALIB_LABELS = {
  1: "nose",
  33: "L-outer-eye",
  263: "R-outer-eye",
  133: "L-inner-eye",
  362: "R-inner-eye",
  52: "L-brow",
  282: "R-brow",
};

// ── Offset tuning ─────────────────────────────────────────────────────────────
// All values are fractions of inter-eye distance.
// Adjust visually using calibration mode before a presentation.
const Y_UP  = 0.38;   // Yintang: how far above inner-eye midpoint
const T_OUT = 0.60;   // Taiyang: how far outward from outer-eye corner
const T_UP  = 0.12;   // Taiyang: how far above outer-eye corner

// ── Geometry ──────────────────────────────────────────────────────────────────
// After CSS scaleX(-1) on the canvas, a point drawn at raw-image x
// appears at (canvasWidth - x) visually.
// So to place a marker on the USER'S LEFT temple (left in mirror):
//   → use landmark 263 (image-right / mirror-left), offset further right in image
// And for the USER'S RIGHT temple (right in mirror):
//   → use landmark 33 (image-left / mirror-right), offset further left in image
function computePoints(lm, w, h) {
  const inner_l = lm[133];
  const inner_r = lm[362];
  const outer_l = lm[33];   // image-left outer eye → user's RIGHT in mirror
  const outer_r = lm[263];  // image-right outer eye → user's LEFT in mirror

  const eyeDist = Math.hypot(
    (outer_r.x - outer_l.x) * w,
    (outer_r.y - outer_l.y) * h,
  );

  return {
    yintang: {
      x: ((inner_l.x + inner_r.x) / 2) * w,
      y: ((inner_l.y + inner_r.y) / 2) * h - eyeDist * Y_UP,
    },
    taiyang_l: {                            // user's LEFT in mirror
      x: outer_r.x * w + eyeDist * T_OUT,  // image-right, pushed further right
      y: outer_r.y * h - eyeDist * T_UP,
    },
    taiyang_r: {                            // user's RIGHT in mirror
      x: outer_l.x * w - eyeDist * T_OUT,  // image-left, pushed further left
      y: outer_l.y * h - eyeDist * T_UP,
    },
  };
}

// ── Canvas drawing ─────────────────────────────────────────────────────────────
function drawMarker(ctx, x, y, isActive, t) {
  const pulse    = isActive ? 1 + Math.sin(t / 380) * 0.22 : 1;
  const r        = (isActive ? 15 : 9) * pulse;
  const glow     = isActive ? 28 : 12;
  const dotColor = isActive ? "#60a5fa" : "rgba(96,165,250,0.7)";

  ctx.save();
  ctx.shadowBlur  = glow;
  ctx.shadowColor = "#93c5fd";

  // Outer ring
  ctx.beginPath();
  ctx.arc(x, y, r + 6, 0, Math.PI * 2);
  ctx.fillStyle = isActive ? "rgba(96,165,250,0.18)" : "rgba(96,165,250,0.07)";
  ctx.fill();

  // Core dot
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = dotColor;
  ctx.fill();

  ctx.restore();
}

// ── Speech ────────────────────────────────────────────────────────────────────
function speak(text, onDone) {
  if (!window.speechSynthesis) { onDone?.(); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate  = 0.92;
  utt.onend = () => onDone?.();
  utt.onerror = () => onDone?.();
  window.speechSynthesis.speak(utt);
}

// ─────────────────────────────────────────────────────────────────────────────
export default function FaceAcupressureDemo() {
  const navigate = useNavigate();

  // UI state
  const [phase, setPhase]             = useState("idle");   // idle|loading|ready|running|done|error
  const [errorMsg, setErrorMsg]       = useState("");
  const [activeId, setActiveId]       = useState(null);
  const [countdown, setCountdown]     = useState(null);
  const [instruction, setInstruction] = useState("");
  const [calibMode, setCalibMode]     = useState(false);

  // Refs (read inside RAF / async without stale-closure issues)
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const landmarkerRef = useRef(null);
  const streamRef     = useRef(null);
  const rafRef        = useRef(null);
  const lastTimeRef   = useRef(-1);
  const activeIdRef   = useRef(null);
  const calibRef      = useRef(false);
  const seqRunRef     = useRef(false);
  const seqTimerRef   = useRef(null);

  // Keep refs in sync with state (only needed for values read inside RAF)
  const setActive = (id) => { activeIdRef.current = id; setActiveId(id); };
  const setCalib  = (v)  => { calibRef.current   = v;  setCalibMode(v); };

  // ── Init: model + camera ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setPhase("loading");
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        if (cancelled) return;

        const lm = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        if (cancelled) { lm.close(); return; }
        landmarkerRef.current = lm;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        const video = videoRef.current;
        video.srcObject = stream;
        await new Promise((res, rej) => {
          video.onloadeddata = res;
          video.onerror = rej;
        });
        video.play().catch(() => {});
        if (cancelled) return;

        canvasRef.current.width  = video.videoWidth;
        canvasRef.current.height = video.videoHeight;

        setPhase("ready");
        startRenderLoop();
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err.message || "Camera or model failed to load.");
          setPhase("error");
        }
      }
    }

    function startRenderLoop() {
      const loop = (t) => {
        renderFrame(t);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }

    function renderFrame(t) {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      const lmk    = landmarkerRef.current;
      if (!video || !canvas || !lmk || video.readyState < 2) return;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (video.currentTime === lastTimeRef.current) return;
      lastTimeRef.current = video.currentTime;

      const result = lmk.detectForVideo(video, performance.now());
      if (!result.faceLandmarks.length) return;

      const landmarks = result.faceLandmarks[0];
      const w = canvas.width;
      const h = canvas.height;

      // Calibration overlay
      if (calibRef.current) {
        ctx.fillStyle = "rgba(250,204,21,0.65)";
        for (let i = 0; i < landmarks.length; i += 3) {
          ctx.beginPath();
          ctx.arc(landmarks[i].x * w, landmarks[i].y * h, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.font       = "bold 11px monospace";
        ctx.fillStyle  = "#fde68a";
        ctx.strokeStyle = "#1e1b4b";
        ctx.lineWidth  = 2.5;
        for (const [idx, lbl] of Object.entries(CALIB_LABELS)) {
          const p = landmarks[parseInt(idx)];
          if (!p) continue;
          const px = p.x * w + 6;
          const py = p.y * h - 6;
          ctx.strokeText(lbl, px, py);
          ctx.fillText(lbl, px, py);
        }
      }

      // Derived acupressure points
      const pts = computePoints(landmarks, w, h);
      const act = activeIdRef.current;
      drawMarker(ctx, pts.yintang.x,   pts.yintang.y,   act === "yintang",   t);
      drawMarker(ctx, pts.taiyang_l.x, pts.taiyang_l.y, act === "taiyang_l", t);
      drawMarker(ctx, pts.taiyang_r.x, pts.taiyang_r.y, act === "taiyang_r", t);
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      clearInterval(seqTimerRef.current);
      window.speechSynthesis?.cancel();
      streamRef.current?.getTracks().forEach(t => t.stop());
      landmarkerRef.current?.close();
    };
  }, []);

  // ── Sequence ────────────────────────────────────────────────────────────────
  function runSequence(index) {
    if (!seqRunRef.current || index >= DEMO_POINTS.length) {
      if (index >= DEMO_POINTS.length) {
        speak("Session complete. Well done!", () => {
          seqRunRef.current = false;
          setPhase("done");
          setActive(null);
          setCountdown(null);
          setInstruction("Session complete!");
        });
      }
      return;
    }

    const pt = DEMO_POINTS[index];
    setActive(pt.id);
    setInstruction(pt.instruction);

    speak(pt.instruction, () => {
      if (!seqRunRef.current) return;
      let rem = pt.duration;
      setCountdown(rem);

      seqTimerRef.current = setInterval(() => {
        rem -= 1;
        setCountdown(rem);
        if (rem <= 0) {
          clearInterval(seqTimerRef.current);
          if (seqRunRef.current) runSequence(index + 1);
        }
      }, 1000);
    });
  }

  const startDemo = () => {
    if (seqRunRef.current) return;
    clearInterval(seqTimerRef.current);
    window.speechSynthesis?.cancel();
    seqRunRef.current = true;
    setPhase("running");
    setActive(null);
    setCountdown(null);
    setInstruction("");
    runSequence(0);
  };

  const stopDemo = () => {
    seqRunRef.current = false;
    clearInterval(seqTimerRef.current);
    window.speechSynthesis?.cancel();
    setPhase("ready");
    setActive(null);
    setCountdown(null);
    setInstruction("");
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const activePoint = DEMO_POINTS.find(p => p.id === activeId);

  return (
    <div className="fad-root">
      <header className="fad-header">
        <button className="fad-icon-btn" onClick={() => navigate(-1)} title="Back">
          <ArrowLeft size={18} />
        </button>
        <div className="fad-logo">
          <Activity size={20} strokeWidth={2.5} />
          <span>Pressurance</span>
          <span className="fad-demo-badge">Live Demo</span>
        </div>
        <button
          className={`fad-icon-btn ${calibMode ? "fad-icon-btn--active" : ""}`}
          onClick={() => setCalib(!calibMode)}
          title="Toggle calibration overlay"
        >
          <Settings size={17} />
        </button>
      </header>

      <main className="fad-main">
        <div className="fad-intro">
          <h1>Face Acupressure Demo</h1>
          <p>Look directly at the camera — glowing dots will show exactly where to press.</p>
        </div>

        {/* Video + canvas stack */}
        <div className="fad-camera-wrap">
          {phase === "loading" && (
            <div className="fad-overlay fad-loading-overlay">
              <div className="fad-spinner" />
              <p>Loading face detection model…</p>
              <p className="fad-loading-sub">First load takes 5–10 s. Subsequent loads are instant.</p>
            </div>
          )}
          {phase === "error" && (
            <div className="fad-overlay fad-error-overlay">
              <Video size={36} />
              <p><strong>Could not start camera</strong></p>
              <p className="fad-loading-sub">{errorMsg}</p>
              <p className="fad-loading-sub">Allow camera access and refresh the page.</p>
            </div>
          )}
          {phase === "idle" && (
            <div className="fad-overlay fad-idle-overlay">
              <Video size={40} />
              <p>Camera will appear here</p>
            </div>
          )}

          {/* Video is always in DOM so ref is available for setup */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="fad-video"
          />
          <canvas ref={canvasRef} className="fad-canvas" />
        </div>

        {/* Caption / countdown */}
        {instruction && (
          <div className="fad-caption">
            <Mic size={14} className="fad-caption-icon" />
            <span className="fad-caption-text">{instruction}</span>
            {countdown !== null && countdown > 0 && (
              <span className="fad-countdown">{countdown}s</span>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="fad-controls">
          {(phase === "ready" || phase === "done") && (
            <button className="fad-btn fad-btn--primary" onClick={startDemo}>
              {phase === "done" ? "Restart Demo" : "Start Demo"}
            </button>
          )}
          {phase === "running" && (
            <button className="fad-btn fad-btn--stop" onClick={stopDemo}>
              Stop
            </button>
          )}
        </div>

        {/* Point legend */}
        <div className="fad-legend">
          {DEMO_POINTS.map(p => (
            <div
              key={p.id}
              className={`fad-legend-item ${activeId === p.id ? "fad-legend-item--active" : ""}`}
            >
              <span className="fad-legend-dot" />
              <span>{p.label}</span>
            </div>
          ))}
        </div>

        {calibMode && (
          <div className="fad-calib-notice">
            <Settings size={13} />
            Calibration mode on — yellow dots show landmark positions. Adjust
            <code>Y_UP</code>, <code>T_OUT</code>, <code>T_UP</code> constants at the top
            of <code>FaceAcupressureDemo.jsx</code> to reposition the markers, then turn
            calibration off.
          </div>
        )}

        <p className="fad-disclaimer">
          This is a technology demonstration. The face landmark positions are derived
          geometrically and should be visually verified using calibration mode before
          a formal session.
        </p>
      </main>
    </div>
  );
}
