import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Activity,
  Bell,
  Settings,
  LogOut,
  Bone,
  Flame,
  Target,
  Calendar,
  Zap,
  PersonStanding,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react";
import "./../styles/Dashboard.css";
import bodyModel from "./../assets/DASHBOARD_2_completed_fields_1-removebg-preview.png";

export default function AccuDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserEmail(decoded.sub || "");
      } catch {
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "U";

  return (
    <div className="db-root">
      {/* ── Navbar ── */}
      <header className="db-nav">
        <div className="db-nav-logo">
          <Activity size={22} strokeWidth={2.5} />
          <span>Pressurance</span>
        </div>
        <nav className="db-nav-links">
          <a className="db-nav-link active">Home</a>
          <a className="db-nav-link">Sessions</a>
          <a className="db-nav-link">Reports</a>
          <a className="db-nav-link">Exercise Library</a>
        </nav>
        <div className="db-nav-actions">
          <button className="db-icon-btn" title="Notifications">
            <Bell size={18} />
            <span className="db-notif-dot" />
          </button>
          <button className="db-icon-btn" title="Settings">
            <Settings size={18} />
          </button>
          <button className="db-avatar-btn" onClick={handleLogout} title="Sign out">
            {initials}
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="db-main">

        {/* ── Left sidebar ── */}
        <aside className="db-left">
          {/* Profile */}
          <div className="db-card db-profile-card">
            <div className="db-avatar-circle">{initials}</div>
            <div className="db-profile-info">
              <h3 className="db-profile-name">{userEmail || "User"}</h3>
              <span className="db-profile-badge">Under Treatment</span>
            </div>
            <div className="db-profile-stats">
              <div className="db-pstat">
                <span className="db-pstat-val">70 kg</span>
                <span className="db-pstat-lbl">Weight</span>
              </div>
              <div className="db-pstat-div" />
              <div className="db-pstat">
                <span className="db-pstat-val">168 cm</span>
                <span className="db-pstat-lbl">Height</span>
              </div>
              <div className="db-pstat-div" />
              <div className="db-pstat">
                <span className="db-pstat-val">A+</span>
                <span className="db-pstat-lbl">Blood</span>
              </div>
            </div>
          </div>

          {/* Recent Pain */}
          <div className="db-card db-info-card">
            <div className="db-info-icon db-icon-rose"><Bone size={18} /></div>
            <div className="db-info-body">
              <p className="db-info-label">Recent Pain Area</p>
              <p className="db-info-title">Right Shoulder</p>
              <p className="db-info-sub">Severity: Moderate · 02 Aug</p>
            </div>
          </div>

          {/* Last Session */}
          <div className="db-card db-info-card">
            <div className="db-info-icon db-icon-blue"><Zap size={18} /></div>
            <div className="db-info-body">
              <p className="db-info-label">Last Session</p>
              <p className="db-info-title">AR Massage Session</p>
              <p className="db-info-sub">12 min · Completed yesterday</p>
            </div>
          </div>

          {/* Daily Goal */}
          <div className="db-card db-info-card">
            <div className="db-info-icon db-icon-green"><Target size={18} /></div>
            <div className="db-info-body">
              <p className="db-info-label">Daily Goal</p>
              <p className="db-info-title">Exercise Target</p>
              <div className="db-goal-bar-wrap">
                <div className="db-goal-bar"><div className="db-goal-fill" style={{ width: "0%" }} /></div>
                <span className="db-goal-pct">0 / 15 min</span>
              </div>
            </div>
          </div>

          {/* Reminder */}
          <div className="db-card db-info-card">
            <div className="db-info-icon db-icon-amber"><Calendar size={18} /></div>
            <div className="db-info-body">
              <p className="db-info-label">Upcoming</p>
              <p className="db-info-title">Check-in Reminder</p>
              <p className="db-info-sub">Today at 8:00 PM</p>
            </div>
          </div>
        </aside>

        {/* ── Center ── */}
        <section className="db-center">
          <div className="db-body-card" onClick={() => navigate("/fullbody")}>
            <img src={bodyModel} alt="Body model" className="db-body-img" />
            <div className="db-body-overlay">
              <div className="db-body-cta">
                <PersonStanding size={20} />
                <span>Tap to begin your session</span>
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
          <p className="db-body-hint">Click anywhere on the body to select a pain area</p>
        </section>

        {/* ── Right sidebar ── */}
        <aside className="db-right">
          {/* Health score */}
          <div className="db-card db-health-card">
            <p className="db-card-title">Health Condition</p>
            <div className="db-ring-wrap">
              <svg viewBox="0 0 100 100" className="db-ring">
                <circle cx="50" cy="50" r="40" className="db-ring-bg" />
                <circle cx="50" cy="50" r="40" className="db-ring-fill"
                  strokeDasharray="251" strokeDashoffset="10" />
              </svg>
              <div className="db-ring-text">
                <span className="db-ring-val">96%</span>
                <span className="db-ring-lbl">Overall</span>
              </div>
            </div>
            <p className="db-health-note">Based on your recent session data</p>
          </div>

          {/* Streaks */}
          <div className="db-card">
            <p className="db-card-title">Streaks</p>
            <div className="db-streak-list">
              <div className="db-streak-row">
                <div className="db-streak-icon db-icon-blue"><Flame size={14} /></div>
                <div>
                  <p className="db-streak-val">3 days</p>
                  <p className="db-streak-lbl">Current streak</p>
                </div>
              </div>
              <div className="db-streak-row">
                <div className="db-streak-icon db-icon-amber"><TrendingUp size={14} /></div>
                <div>
                  <p className="db-streak-val">7 days</p>
                  <p className="db-streak-lbl">Best streak</p>
                </div>
              </div>
              <div className="db-streak-row">
                <div className="db-streak-icon db-icon-green"><Target size={14} /></div>
                <div>
                  <p className="db-streak-val">Consistent Healer</p>
                  <p className="db-streak-lbl">Badge earned</p>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested */}
          <div className="db-card">
            <p className="db-card-title">Suggested Today</p>
            <div className="db-suggest-list">
              <div className="db-suggest-row">
                <Clock size={15} className="db-suggest-icon" />
                <span>Shoulder rotations · 3×/day</span>
              </div>
              <div className="db-suggest-row">
                <Clock size={15} className="db-suggest-icon" />
                <span>2 min posture break</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
