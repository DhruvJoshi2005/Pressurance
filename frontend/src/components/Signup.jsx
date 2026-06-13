import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Activity, Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import "./../styles/Signup.css";

export default function Signup() {
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
      await axios.post("http://localhost:8000/auth/register", form);
      const loginRes = await axios.post("http://localhost:8000/auth/login", form);
      localStorage.setItem("token", loginRes.data.access_token);
      navigate("/medical-history");
    } catch (err) {
      const msg = err.response?.data?.detail || "Signup failed. Please try again.";
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
        <h2 className="auth-left-title">Your health, understood.</h2>
        <p className="auth-left-sub">
          AI-powered pain assessment and personalised acupressure guidance —
          all in one place.
        </p>
        <ul className="auth-features">
          <li>3D body pain mapping</li>
          <li>AI symptom diagnosis</li>
          <li>Live acupressure guidance</li>
          <li>Specialist doctor connect</li>
        </ul>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-card-title">Create your account</h1>
            <p className="auth-card-sub">
              Already have an account?{" "}
              <Link to="/login" className="auth-link">Sign in</Link>
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
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  className="auth-input"
                  required
                  minLength={8}
                  autoComplete="new-password"
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
              {loading ? <span className="btn-spinner" /> : "Create Account"}
            </button>
          </form>

          <p className="auth-legal">
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
