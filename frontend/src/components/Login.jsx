import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Activity, Eye, EyeOff, Mail, Lock, AlertCircle, Zap } from "lucide-react";
import api from "../utils/api";
import "./../styles/Login.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", form);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("refreshToken", res.data.refresh_token);
      await api.post("/humanModel/start-session");
      navigate("/Accudashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left panel ── */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="auth-brand">
            <Activity size={24} strokeWidth={2.5} />
            <span>Pressurance</span>
          </div>

          <h2 className="auth-left-title">
            Welcome<br /><span>back.</span>
          </h2>
          <p className="auth-left-sub">
            Sign in to continue your personalised pain assessment
            and acupressure therapy session.
          </p>

          <ul className="auth-features">
            <li>Pick up where you left off</li>
            <li>AI-powered symptom analysis</li>
            <li>Live acupressure guidance</li>
            <li>Your health history, always ready</li>
          </ul>

          <div className="auth-left-badges">
            <span className="auth-badge"><Zap size={10} /> Real-time AR</span>
            <span className="auth-badge">3D Body Map</span>
            <span className="auth-badge">16+ Pain Zones</span>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-card-title">Sign in to your account</h1>
            <p className="auth-card-sub">
              Don't have an account?{" "}
              <Link to="/signup" className="auth-link">Create one free</Link>
            </p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label">Email address</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  name="email" type="email"
                  placeholder="you@example.com"
                  value={form.email} onChange={handleChange}
                  className="auth-input" required autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  name="password" type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password} onChange={handleChange}
                  className="auth-input" required autoComplete="current-password"
                />
                <button type="button" className="input-toggle"
                  onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : "Sign In"}
            </button>
          </form>

          <p className="auth-legal">
            By signing in you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
