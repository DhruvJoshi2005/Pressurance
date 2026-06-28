import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, Brain, Camera, ChevronRight, Heart,
  MapPin, Shield, Stethoscope, UserCheck, Zap,
} from "lucide-react";
import "./../styles/LandingPage.css";

// Attach .in class when element enters viewport
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); } }),
      { threshold: 0.12 }
    );
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll(".aos").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const ref = useScrollReveal();

  return (
    <div className="lp-root" ref={ref}>

      {/* ── Animated background ── */}
      <div className="lp-bg">
        <div className="lp-bg-grid" />
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />
      </div>

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <Activity size={24} strokeWidth={2.5} />
          <span>Pressurance</span>
        </div>
        <div className="lp-nav-actions">
          <button className="lp-btn-ghost" onClick={() => navigate("/login")}>Sign In</button>
          <button className="lp-btn-sm"    onClick={() => navigate("/signup")}>Get Started</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-badge">
          <span className="lp-hero-badge-dot" />
          <Shield size={12} /> AI-Powered Pain Relief Platform
        </div>

        <h1 className="lp-hero-title">
          Smart Pain Assessment<br />
          &amp; <span className="lp-hero-accent">Acupressure Guidance</span>
        </h1>

        <p className="lp-hero-sub">
          Map your pain on a 3D body model, let AI analyse your health history and symptoms,
          then receive personalised acupressure therapy — guided in real time by your camera.
        </p>

        <div className="lp-hero-cta">
          <button className="lp-btn-primary" onClick={() => navigate("/signup")}>
            Start Free &nbsp;<ChevronRight size={18} />
          </button>
          <button className="lp-btn-outline" onClick={() => navigate("/login")}>
            Sign In
          </button>
        </div>

        <div className="lp-hero-stats">
          <div className="lp-stat">
            <span className="lp-stat-value">3D</span>
            <span className="lp-stat-label">Body Mapping</span>
          </div>
          <div className="lp-stat-div" />
          <div className="lp-stat">
            <span className="lp-stat-value">AI</span>
            <span className="lp-stat-label">Recommendation</span>
          </div>
          <div className="lp-stat-div" />
          <div className="lp-stat">
            <span className="lp-stat-value">Live</span>
            <span className="lp-stat-label">Camera Tracking</span>
          </div>
          <div className="lp-stat-div" />
          <div className="lp-stat">
            <span className="lp-stat-value">16+</span>
            <span className="lp-stat-label">Pain Zones</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section lp-features">
        <p className="lp-section-label aos">What We Offer</p>
        <h2 className="lp-section-title aos d1">
          Everything you need,<br /><span>in one platform</span>
        </h2>

        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div className={`lp-feature-card aos d${i + 1}`} key={f.title}>
              <div className={`lp-feature-icon fi-${f.color}`}>{f.icon}</div>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-section lp-how">
        <p className="lp-section-label aos">How It Works</p>
        <h2 className="lp-section-title aos d1">
          From sign-up to<br /><span>relief in five steps</span>
        </h2>

        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <div className={`lp-step aos d${i + 1}`} key={s.title}>
              <div className="lp-step-connector" />
              <div className="lp-step-num">{s.n}</div>
              <div className="lp-step-body">
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Social proof ── */}
      <div className="lp-proof">
        {PROOF.map(p => (
          <div className="lp-proof-item aos" key={p.value}>
            <span className="lp-proof-value">{p.value}</span>
            <span className="lp-proof-label">{p.label}</span>
          </div>
        ))}
      </div>

      {/* ── CTA ── */}
      <section className="lp-section lp-cta">
        <div className="lp-cta-glow" />
        <h2 className="lp-cta-title aos">Ready to understand your pain?</h2>
        <p  className="lp-cta-sub aos d1">
          Join thousands using Pressurance for smarter, personalised pain relief.
        </p>
        <button
          className="lp-btn-primary lp-btn-lg aos d2"
          onClick={() => navigate("/signup")}
        >
          Get Started for Free &nbsp;<ChevronRight size={20} />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">
          <Activity size={16} strokeWidth={2.5} />
          <span>Pressurance</span>
        </div>
        <p className="lp-footer-note">
          © 2025 Pressurance. For informational purposes only — not a substitute for professional medical advice.
        </p>
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon: <MapPin size={22} />,         title: "3D Pain Mapping",     color: "blue",   desc: "Interact with a detailed 3D human model to pinpoint your exact pain location — front, back, or any body part." },
  { icon: <Heart size={22} />,          title: "Symptom Analysis",    color: "rose",   desc: "Select your symptoms from a curated medical list. The system tracks pain type — sudden, chronic, or acute." },
  { icon: <Brain size={22} />,          title: "AI Prediction",       color: "violet", desc: "Our rule-based engine combines your health history with current symptoms to surface the right acupressure points." },
  { icon: <Camera size={22} />,         title: "Live Acupressure",    color: "teal",   desc: "Your camera detects your face or body in real time and overlays precise acupressure points with step-by-step guidance." },
  { icon: <UserCheck size={22} />,      title: "Health History",      color: "amber",  desc: "Securely store past conditions so every future assessment is personalised to your unique medical profile." },
  { icon: <Stethoscope size={22} />,    title: "Safety First",        color: "green",  desc: "Built-in red-flag detection flags severe pain patterns and recommends professional consultation before proceeding." },
];

const STEPS = [
  { n: "01", title: "Create your account",   desc: "Sign up with your email — takes under a minute." },
  { n: "02", title: "Add health history",    desc: "Tell us about past conditions so AI can personalise your results." },
  { n: "03", title: "Map your pain",         desc: "Rotate the 3D model and tap the area that hurts." },
  { n: "04", title: "Describe symptoms",     desc: "Choose symptoms, pain type, and severity from guided lists." },
  { n: "05", title: "Get your guidance",     desc: "Receive a personalised recommendation and live camera-guided acupressure session." },
];

const PROOF = [
  { value: "16+",  label: "Pain Zones Covered" },
  { value: "13",   label: "Acupressure Points" },
  { value: "3D",   label: "Body Model" },
  { value: "Live", label: "Camera Tracking" },
  { value: "100%", label: "Free to Use" },
];
