import { useNavigate } from "react-router-dom";
import {
  Activity,
  Brain,
  Camera,
  ChevronRight,
  Heart,
  MapPin,
  Shield,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import "./../styles/LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-root">
      <nav className="landing-nav">
        <div className="nav-logo">
          <Activity size={26} strokeWidth={2.5} />
          <span>Pressurance</span>
        </div>
        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => navigate("/login")}>
            Sign In
          </button>
          <button className="btn-primary-sm" onClick={() => navigate("/signup")}>
            Get Started
          </button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-badge">
          <Shield size={14} /> AI-Powered Medical Assistant
        </div>
        <h1 className="hero-title">
          Smart Pain Assessment &<br />
          <span className="hero-title-accent">Acupressure Guidance</span>
        </h1>
        <p className="hero-subtitle">
          Map your pain on a 3D body model, let AI analyse your health history
          and symptoms, then receive personalised acupressure therapy — guided
          in real time by your camera.
        </p>
        <div className="hero-cta">
          <button className="btn-primary" onClick={() => navigate("/signup")}>
            Start Free <ChevronRight size={18} />
          </button>
          <button className="btn-outline" onClick={() => navigate("/login")}>
            Sign In
          </button>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-value">3D</span>
            <span className="stat-label">Body Mapping</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">AI</span>
            <span className="stat-label">Diagnosis</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">Live</span>
            <span className="stat-label">Camera Guidance</span>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-label">What We Offer</div>
        <h2 className="section-title">Everything you need, in one place</h2>
        <div className="features-grid">
          <FeatureCard
            icon={<MapPin size={24} />}
            title="3D Pain Mapping"
            desc="Interact with a detailed 3D human model to pinpoint your exact pain location — front, back, or any body part."
            color="blue"
          />
          <FeatureCard
            icon={<Heart size={24} />}
            title="Symptom Analysis"
            desc="Select your symptoms from a curated medical list. The system tracks pain type — sudden, chronic, or acute."
            color="rose"
          />
          <FeatureCard
            icon={<Brain size={24} />}
            title="AI Prediction"
            desc="Our ML model combines your health history with current symptoms to predict underlying conditions accurately."
            color="violet"
          />
          <FeatureCard
            icon={<Camera size={24} />}
            title="Live Acupressure"
            desc="Your camera detects your body in real time and overlays precise acupressure points with step-by-step guidance."
            color="teal"
          />
          <FeatureCard
            icon={<UserCheck size={24} />}
            title="Health History"
            desc="Securely store past conditions so every future assessment is personalised to your unique medical profile."
            color="amber"
          />
          <FeatureCard
            icon={<Stethoscope size={24} />}
            title="Doctor Connect"
            desc="For critical findings the system connects you directly with specialist doctors who can help immediately."
            color="green"
          />
        </div>
      </section>

      <section className="how-section">
        <div className="section-label">How It Works</div>
        <h2 className="section-title">From signup to relief in five steps</h2>
        <div className="steps-list">
          <Step n="01" title="Create your account" desc="Sign up with your email — takes under a minute." />
          <Step n="02" title="Add health history" desc="Tell us about past conditions so AI can personalise your results." />
          <Step n="03" title="Map your pain" desc="Rotate the 3D model and tap the area that hurts." />
          <Step n="04" title="Describe symptoms" desc="Choose symptoms, pain type, and severity from guided lists." />
          <Step n="05" title="Get your guidance" desc="Receive an AI diagnosis and live camera-guided acupressure therapy." />
        </div>
      </section>

      <section className="cta-section">
        <h2 className="cta-title">Ready to understand your pain?</h2>
        <p className="cta-sub">Join thousands using Pressurance for smarter, personalised pain relief.</p>
        <button className="btn-primary btn-large" onClick={() => navigate("/signup")}>
          Get Started for Free <ChevronRight size={20} />
        </button>
      </section>

      <footer className="landing-footer">
        <div className="footer-logo">
          <Activity size={18} strokeWidth={2.5} />
          <span>Pressurance</span>
        </div>
        <p className="footer-note">© 2025 Pressurance. For informational purposes only — not a substitute for professional medical advice.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color }) {
  return (
    <div className={`feature-card feature-card--${color}`}>
      <div className={`feature-icon feature-icon--${color}`}>{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }) {
  return (
    <div className="step">
      <div className="step-number">{n}</div>
      <div className="step-content">
        <h3 className="step-title">{title}</h3>
        <p className="step-desc">{desc}</p>
      </div>
    </div>
  );
}
