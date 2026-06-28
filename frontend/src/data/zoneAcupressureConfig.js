// Single source of truth for zone → live-session configuration.
// derive(lm, w, h) receives normalized MediaPipe landmarks and canvas dims,
// returns {x, y} in pixel space for the canvas overlay dot.
// Mirror note: canvas has CSS scaleX(-1), so raw-image coords map correctly.

// ── Helpers ──────────────────────────────────────────────────────────────────
const ed   = (lm, w, h) => Math.hypot((lm[263].x - lm[33].x) * w, (lm[263].y - lm[33].y) * h);
const off  = (pt, dx, dy, w, h) => ({ x: pt.x * w + dx, y: pt.y * h + dy });
const mid  = (a, b, w, h) => ({ x: ((a.x + b.x) / 2) * w, y: ((a.y + b.y) / 2) * h });
const lerp = (a, b, t, w, h) => ({
  x: (a.x + (b.x - a.x) * t) * w,
  y: (a.y + (b.y - a.y) * t) * h,
});

// ── Config ────────────────────────────────────────────────────────────────────
// mode: "face"    → FaceTrackedPoint  (FaceLandmarker, front camera)
//       "pose"    → PoseTrackedPoint  (PoseLandmarker, shoulder/neck, falls back to diagram)
//       "diagram" → DiagramPoint      (static SVG illustration, no camera needed)
//
// diagramAlt: one of "back-neck" | "shoulder" | "hand" | "wrist" | null
//   (used when mode="diagram" OR as fallback when pose confidence is low)

export const ZONE_CONFIG = {
  // ── Face-mode zones ────────────────────────────────────────────────────────
  Temple_Left: {
    pointName: "Taiyang — Left Temple",
    code: "TAIYANG",
    mode: "face",
    zoneLabel: "Left Temple",
    instruction:
      "Press lightly in a small circular motion on your left temple for 10 seconds.",
    duration: 10,
    relatedCondition: "Migraine / Chronic Headaches",
    diagramAlt: null,
    // lm[33] = image-left outer eye. After CSS mirror this is user's RIGHT side —
    // negative dx pushes further left in image → further right in mirror = user's LEFT ✓
    // Verify side assignment with calibration tool and swap if needed.
    derive: (lm, w, h) => {
      const eyeDist = ed(lm, w, h);
      return off(lm[33], -0.55 * eyeDist, -0.15 * eyeDist, w, h);
    },
  },

  Temple_Right: {
    pointName: "Taiyang — Right Temple",
    code: "TAIYANG",
    mode: "face",
    zoneLabel: "Right Temple",
    instruction:
      "Now apply gentle circular pressure on your right temple for 10 seconds.",
    duration: 10,
    relatedCondition: "Migraine / Chronic Headaches",
    diagramAlt: null,
    derive: (lm, w, h) => {
      const eyeDist = ed(lm, w, h);
      return off(lm[263], 0.55 * eyeDist, -0.15 * eyeDist, w, h);
    },
  },

  Mid_Forehead_Pain: {
    pointName: "Yintang — Third Eye Point",
    code: "YINTANG",
    mode: "face",
    zoneLabel: "Mid Forehead",
    instruction:
      "Apply gentle, steady pressure between your eyebrows for 10 seconds.",
    duration: 10,
    relatedCondition: "Sinusitis / Sinus Congestion",
    diagramAlt: null,
    derive: (lm, w, h) => {
      const eyeDist = ed(lm, w, h);
      const m = mid(lm[133], lm[362], w, h);
      return { x: m.x, y: m.y - eyeDist * 0.38 };
    },
  },

  Forehead_Left: {
    pointName: "Yangbai — Left Forehead",
    code: "GB14",
    mode: "face",
    zoneLabel: "Left Forehead",
    instruction:
      "Apply gentle upward pressure just above your left eyebrow for 10 seconds.",
    duration: 10,
    relatedCondition: "Sinusitis / Sinus Congestion",
    diagramAlt: null,
    derive: (lm, w, h) => {
      const eyeDist = ed(lm, w, h);
      return off(lm[52], 0, -0.25 * eyeDist, w, h);
    },
  },

  Forehead_Right: {
    pointName: "Yangbai — Right Forehead",
    code: "GB14",
    mode: "face",
    zoneLabel: "Right Forehead",
    instruction:
      "Apply gentle upward pressure just above your right eyebrow for 10 seconds.",
    duration: 10,
    relatedCondition: "Sinusitis / Sinus Congestion",
    diagramAlt: null,
    derive: (lm, w, h) => {
      const eyeDist = ed(lm, w, h);
      return off(lm[282], 0, -0.25 * eyeDist, w, h);
    },
  },

  Ear_Left: {
    pointName: "Ermen — Left Ear Gate",
    code: "TB21",
    mode: "face",
    zoneLabel: "Left Ear Area",
    instruction:
      "Apply gentle, circular pressure just in front of your left ear opening for 10 seconds.",
    duration: 10,
    relatedCondition: "Tinnitus (Ringing in Ears)",
    diagramAlt: null,
    derive: (lm, w, h) => {
      const eyeDist = ed(lm, w, h);
      return off(lm[33], -1.3 * eyeDist, 0.1 * eyeDist, w, h);
    },
  },

  Ear_Right: {
    pointName: "Ermen — Right Ear Gate",
    code: "TB21",
    mode: "face",
    zoneLabel: "Right Ear Area",
    instruction:
      "Apply gentle, circular pressure just in front of your right ear opening for 10 seconds.",
    duration: 10,
    relatedCondition: "Tinnitus (Ringing in Ears)",
    diagramAlt: null,
    derive: (lm, w, h) => {
      const eyeDist = ed(lm, w, h);
      return off(lm[263], 1.3 * eyeDist, 0.1 * eyeDist, w, h);
    },
  },

  Skull_Pain: {
    pointName: "Baihui — Crown of Head",
    code: "GV20",
    mode: "face",
    zoneLabel: "Top of Skull",
    instruction:
      "Apply gentle, circular pressure at the crown of your head for 10 seconds.",
    duration: 10,
    relatedCondition: "Vertigo / Dizziness",
    diagramAlt: null,
    derive: (lm, w, h) => {
      const eyeDist = ed(lm, w, h);
      return off(lm[10], 0, -0.45 * eyeDist, w, h);
    },
  },

  Jaw_Cheek_Left: {
    pointName: "Xiaguan — Left Jaw Hinge",
    code: "ST7",
    mode: "face",
    zoneLabel: "Left Jaw / Cheek",
    instruction:
      "Apply firm, circular pressure in front of your left ear at the jaw hinge for 10 seconds.",
    duration: 10,
    relatedCondition: "TMJ / Jaw Pain",
    diagramAlt: null,
    derive: (lm, w, h) => lerp(lm[61], lm[33], 0.7, w, h),
  },

  Jaw_Cheek_Right: {
    pointName: "Xiaguan — Right Jaw Hinge",
    code: "ST7",
    mode: "face",
    zoneLabel: "Right Jaw / Cheek",
    instruction:
      "Apply firm, circular pressure in front of your right ear at the jaw hinge for 10 seconds.",
    duration: 10,
    relatedCondition: "TMJ / Jaw Pain",
    diagramAlt: null,
    derive: (lm, w, h) => lerp(lm[291], lm[263], 0.7, w, h),
  },

  // ── Diagram-mode zone (back camera can't see this) ─────────────────────────
  Back_Neck_Pain: {
    pointName: "Fengchi (GB20) — Base of Skull",
    code: "GB20",
    mode: "diagram",
    zoneLabel: "Back of Neck",
    instruction:
      "Place both thumbs in the hollows at the base of your skull, on either side of your spine. Apply firm, upward pressure for 10 seconds.",
    duration: 10,
    relatedCondition: "Cervical Spondylosis (Neck Stiffness)",
    diagramAlt: "back-neck",
    derive: null,
  },

  // ── Pose-mode zones (shoulder/neck visible to front camera from a distance) ─
  Neck_Center: {
    pointName: "Jianjing — Shoulder Well",
    code: "GB21",
    mode: "pose",
    zoneLabel: "Center Neck",
    instruction:
      "Apply gentle downward pressure at the top of your shoulder, midway between your neck and shoulder tip, for 10 seconds.",
    duration: 10,
    relatedCondition: "Cervical Spondylosis (Neck Stiffness)",
    diagramAlt: "shoulder",
    // Pose landmarks: 11=left shoulder, 12=right shoulder
    derive: (lm, w, h) => {
      const sx = ((lm[11].x + lm[12].x) / 2) * w;
      const sy = ((lm[11].y + lm[12].y) / 2) * h;
      const shoulderSpan = Math.abs((lm[12].x - lm[11].x) * w);
      return { x: sx, y: sy - 0.1 * shoulderSpan };
    },
  },

  Neck_Left: {
    pointName: "Tianzhu (BL10) — Left Neck",
    code: "BL10",
    mode: "pose",
    zoneLabel: "Left Neck",
    instruction:
      "Apply gentle pressure midway between your left ear and left shoulder for 10 seconds.",
    duration: 10,
    relatedCondition: "Cervical Spondylosis (Neck Stiffness)",
    diagramAlt: "shoulder",
    // Pose landmarks: 7=left ear, 11=left shoulder
    derive: (lm, w, h) => ({
      x: ((lm[7].x + lm[11].x) / 2) * w,
      y: ((lm[7].y + lm[11].y) / 2) * h,
    }),
  },

  Neck_Right: {
    pointName: "Tianzhu (BL10) — Right Neck",
    code: "BL10",
    mode: "pose",
    zoneLabel: "Right Neck",
    instruction:
      "Apply gentle pressure midway between your right ear and right shoulder for 10 seconds.",
    duration: 10,
    relatedCondition: "Cervical Spondylosis (Neck Stiffness)",
    diagramAlt: "shoulder",
    // Pose landmarks: 8=right ear, 12=right shoulder
    derive: (lm, w, h) => ({
      x: ((lm[8].x + lm[12].x) / 2) * w,
      y: ((lm[8].y + lm[12].y) / 2) * h,
    }),
  },

  Shoulder_Left: {
    pointName: "Jianjing — Left Shoulder Well",
    code: "GB21",
    mode: "pose",
    zoneLabel: "Left Shoulder",
    instruction:
      "Apply firm downward pressure at the highest point of your left shoulder for 10 seconds.",
    duration: 10,
    relatedCondition: "Cervical Spondylosis (Neck Stiffness)",
    diagramAlt: "shoulder",
    // Pose landmark 11 = left shoulder
    derive: (lm, w, h) => ({ x: lm[11].x * w, y: lm[11].y * h }),
  },

  Shoulder_Right: {
    pointName: "Jianjing — Right Shoulder Well",
    code: "GB21",
    mode: "pose",
    zoneLabel: "Right Shoulder",
    instruction:
      "Apply firm downward pressure at the highest point of your right shoulder for 10 seconds.",
    duration: 10,
    relatedCondition: "Cervical Spondylosis (Neck Stiffness)",
    diagramAlt: "shoulder",
    // Pose landmark 12 = right shoulder
    derive: (lm, w, h) => ({ x: lm[12].x * w, y: lm[12].y * h }),
  },
};

// Maps a point code (from recommendation engine) to its fallback diagram type
export const POINT_DIAGRAM_TYPE = {
  TAIYANG: null,   // handled live via zone config
  YINTANG: null,
  GB14:    null,
  TB21:    null,
  GV20:    null,
  ST7:     null,
  SI18:    "jaw",
  GB20:    "back-neck",
  BL10:    "back-neck",
  GB21:    "shoulder",
  LI4:     "hand",
  PC6:     "wrist",
};
