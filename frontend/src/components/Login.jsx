import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Activity, Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
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
      const res = await axios.post("http://localhost:8000/auth/login", form);
      const token = res.data.access_token;
      localStorage.setItem("token", token);

      await axios.post(
        "http://localhost:8000/humanModel/start-session",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate("/Accudashboard");
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <Activity size={28} strokeWidth={2.5} />
          <span>Pressurance</span>
        </div>
        <h2 className="auth-left-title">Welcome back.</h2>
        <p className="auth-left-sub">
          Sign in to continue your personalised pain assessment and
          acupressure therapy session.
        </p>
        <ul className="auth-features">
          <li>Pick up where you left off</li>
          <li>AI-powered symptom analysis</li>
          <li>Live acupressure guidance</li>
          <li>Your health history, always ready</li>
        </ul>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-card-title">Sign in to your account</h1>
            <p className="auth-card-sub">
              Don't have an account?{" "}
              <Link to="/signup" className="auth-link">Create one</Link>
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
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="auth-input"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  className="auth-input"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
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
