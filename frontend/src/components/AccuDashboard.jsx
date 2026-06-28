import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../utils/api";
import {
  Activity, Bell, Settings, Bone, Flame, Target, Calendar, Zap,
  PersonStanding, TrendingUp, Clock, ChevronRight, Brain, Heart, Wind,
  Utensils, Dumbbell, BookOpen, Play, Search, Award, MapPin, FileText,
  AlertTriangle, Plus, BarChart2, Video,
} from "lucide-react";
import "./../styles/Dashboard.css";
import bodyModel from "./../assets/DASHBOARD_2_completed_fields_1-removebg-preview.png";

const BODY_SECTIONS = [
  { key: "head_neck",       label: "Head & Neck",           icon: Brain,          color: "violet" },
  { key: "chest_heart",     label: "Chest & Heart",         icon: Heart,          color: "rose"   },
  { key: "respiratory",     label: "Lungs & Respiratory",   icon: Wind,           color: "blue"   },
  { key: "abdomen",         label: "Abdomen & Digestive",   icon: Utensils,       color: "amber"  },
  { key: "spine_back",      label: "Spine & Back",          icon: Bone,           color: "orange" },
  { key: "shoulders_arms",  label: "Shoulders & Arms",      icon: Dumbbell,       color: "teal"   },
  { key: "hips_legs",       label: "Hips & Legs",           icon: PersonStanding, color: "green"  },
  { key: "systemic",        label: "General / Systemic",    icon: Activity,       color: "indigo" },
];


const SEVERITY_LABEL = s => s <= 3 ? "Mild" : s <= 6 ? "Moderate" : "Severe";
const SEVERITY_COLOR = s => s <= 3 ? "green" : s <= 6 ? "amber" : "rose";

const fmtDate = d =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function AccuDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [userEmail, setUserEmail]       = useState("");
  const [activeTab, setActiveTab]       = useState("home");
  const [medicalHistory, setMedicalHistory] = useState({});
  const [exercises, setExercises]       = useState([]);
  const [searchTerm, setSearchTerm]     = useState("");
  const [sessions, setSessions]         = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [statsData, setStatsData]       = useState(null);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setMedicalHistory(res.data.medical_history || {});
    } catch {
      // fall through — medical history stays empty
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get("/pain/assessment/history?limit=20&skip=0");
      setSessions(res.data.data || []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/pain/assessment/stats");
      setStatsData(res.data.data || null);
    } catch {
      setStatsData(null);
    }
  }, []);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    try {
      const decoded = jwtDecode(token);
      setUserEmail(decoded.sub || "");
    } catch {
      navigate("/login");
      return;
    }
    fetchUserData();
    fetchSessions();
    fetchStats();
    fetch("/acupressureData.json")
      .then(r => r.json())
      .then(data => setExercises(data))
      .catch(() => {});
  }, []);

  // Re-fetch medical history when the tab changes back to home/reports
  useEffect(() => {
    if (activeTab === "home" || activeTab === "reports") fetchUserData();
    if (activeTab === "sessions") fetchSessions();
  }, [activeTab]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (refreshToken) await api.post("/auth/logout", { refresh_token: refreshToken });
    } catch { /* ignore — clear anyway */ }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  const initials      = userEmail ? userEmail.slice(0, 2).toUpperCase() : "U";
  const totalConds    = Object.values(medicalHistory).flat().length;
  const activeSections = BODY_SECTIONS.filter(s => medicalHistory[s.key]?.length > 0);
  const firstSection  = activeSections[0];

  const TABS = [
    { key: "home",      label: "Home"             },
    { key: "sessions",  label: "Sessions"          },
    { key: "reports",   label: "Reports"           },
    { key: "exercises", label: "Exercise Library"  },
  ];

  const filteredExercises = exercises.filter(ex =>
    !searchTerm || ex.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="db-root">
      {/* ── Navbar ── */}
      <header className="db-nav">
        <div className="db-nav-logo">
          <Activity size={22} strokeWidth={2.5} />
          <span>Pressurance</span>
        </div>
        <nav className="db-nav-links">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`db-nav-link ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
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

      {/* ══════════ HOME TAB ══════════ */}
      {activeTab === "home" && (
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
                <div className="db-pstat"><span className="db-pstat-val">70 kg</span><span className="db-pstat-lbl">Weight</span></div>
                <div className="db-pstat-div" />
                <div className="db-pstat"><span className="db-pstat-val">168 cm</span><span className="db-pstat-lbl">Height</span></div>
                <div className="db-pstat-div" />
                <div className="db-pstat"><span className="db-pstat-val">A+</span><span className="db-pstat-lbl">Blood</span></div>
              </div>
            </div>

            {/* Medical History */}
            {totalConds > 0 ? (
              <div className="db-card db-mh-card">
                <div className="db-mh-card-header">
                  <p className="db-card-title" style={{ margin: 0 }}>Medical History</p>
                  <span className="db-mh-total-badge">{totalConds} condition{totalConds !== 1 ? "s" : ""}</span>
                </div>
                <div className="db-mh-list">
                  {activeSections.map(section => {
                    const Icon = section.icon;
                    const conds = medicalHistory[section.key] || [];
                    return (
                      <div key={section.key} className="db-mh-section">
                        <div className="db-mh-row">
                          <div className={`db-mh-icon db-icon-${section.color}`}><Icon size={12} /></div>
                          <span className="db-mh-section-label">{section.label}</span>
                          <span className="db-mh-count">{conds.length}</span>
                        </div>
                        <div className="db-mh-tags">
                          {conds.map(c => (
                            <span key={c} className={`db-mh-tag db-tag-${section.color}`}>{c}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="db-card db-mh-empty-card">
                <FileText size={22} className="db-mh-empty-icon" />
                <p className="db-mh-empty-title">No medical history</p>
                <p className="db-mh-empty-sub">Add conditions for personalised care</p>
                <button className="db-outline-btn" onClick={() => navigate("/medical-history")}>
                  <Plus size={13} /> Add History
                </button>
              </div>
            )}

            {/* Recent Pain */}
            <div className="db-card db-info-card">
              <div className="db-info-icon db-icon-rose"><Bone size={18} /></div>
              <div className="db-info-body">
                <p className="db-info-label">Recent Pain Area</p>
                <p className="db-info-title">Right Shoulder</p>
                <p className="db-info-sub">Severity: Moderate · 26 Jun</p>
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

            {/* Upcoming */}
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
            {/* Health Condition */}
            <div className="db-card db-health-card">
              <p className="db-card-title">Health Condition</p>
              <div className="db-ring-wrap">
                <svg viewBox="0 0 100 100" className="db-ring">
                  <defs>
                    <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%"   stopColor="#1565c0" />
                      <stop offset="100%" stopColor="#0288d1" />
                    </linearGradient>
                  </defs>
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

            {/* Last Session */}
            <div className="db-card">
              <p className="db-card-title">Last Session</p>
              <div className="db-last-session-wrap">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div className="db-info-icon db-icon-blue"><Zap size={15} /></div>
                  <div>
                    <p className="db-info-title" style={{ margin: 0 }}>AR Massage Session</p>
                    <p className="db-info-sub">Right Shoulder</p>
                  </div>
                </div>
                <div className="db-session-mini-stats">
                  <div className="db-session-mini-stat">
                    <span className="db-session-mini-val">12 min</span>
                    <span className="db-session-mini-lbl">Duration</span>
                  </div>
                  <div className="db-session-mini-stat">
                    <span className="db-session-mini-val db-col-amber">6 / 10</span>
                    <span className="db-session-mini-lbl">Severity</span>
                  </div>
                  <div className="db-session-mini-stat">
                    <span className="db-session-mini-val db-col-green">Done</span>
                    <span className="db-session-mini-lbl">Status</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Streaks */}
            <div className="db-card">
              <p className="db-card-title">Streaks</p>
              <div className="db-streak-list">
                <div className="db-streak-row">
                  <div className="db-streak-icon db-icon-blue"><Flame size={14} /></div>
                  <div><p className="db-streak-val">3 days</p><p className="db-streak-lbl">Current streak</p></div>
                </div>
                <div className="db-streak-row">
                  <div className="db-streak-icon db-icon-amber"><TrendingUp size={14} /></div>
                  <div><p className="db-streak-val">7 days</p><p className="db-streak-lbl">Best streak</p></div>
                </div>
                <div className="db-streak-row">
                  <div className="db-streak-icon db-icon-green"><Award size={14} /></div>
                  <div><p className="db-streak-val">Consistent Healer</p><p className="db-streak-lbl">Badge earned</p></div>
                </div>
              </div>
            </div>

            {/* Live Demo CTA */}
            <div
              className="db-card db-demo-card"
              onClick={() => navigate("/live-demo")}
              style={{ cursor: "pointer" }}
            >
              <div className="db-demo-card-inner">
                <Video size={22} className="db-demo-icon" />
                <div>
                  <p className="db-demo-title">Live Face Demo</p>
                  <p className="db-demo-sub">Real-time acupressure point overlay on your webcam</p>
                </div>
                <ChevronRight size={18} className="db-demo-arrow" />
              </div>
            </div>

            {/* Suggested Today */}
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
                {firstSection && (
                  <div className="db-suggest-row">
                    <Clock size={15} className="db-suggest-icon" />
                    <span>Acupressure for {firstSection.label}</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </main>
      )}

      {/* ══════════ SESSIONS TAB ══════════ */}
      {activeTab === "sessions" && (
        <div className="db-page">
          <div className="db-page-header">
            <div>
              <h1 className="db-page-title">Sessions</h1>
              <p className="db-page-sub">Your acupressure and AR massage history</p>
            </div>
            <button className="db-primary-btn" onClick={() => navigate("/fullbody")}>
              <Play size={15} /> New Session
            </button>
          </div>

          {/* Stats */}
          <div className="db-stats-row">
            <div className="db-stat-card">
              <div className="db-stat-icon db-icon-blue"><Activity size={18} /></div>
              <div>
                <p className="db-stat-val">5</p>
                <p className="db-stat-lbl">Total Sessions</p>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-icon db-icon-green"><Flame size={18} /></div>
              <div>
                <p className="db-stat-val">2</p>
                <p className="db-stat-lbl">This Week</p>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-icon db-icon-violet"><Clock size={18} /></div>
              <div>
                <p className="db-stat-val">75 min</p>
                <p className="db-stat-lbl">Total Time</p>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-icon db-icon-amber"><TrendingUp size={18} /></div>
              <div>
                <p className="db-stat-val">15 min</p>
                <p className="db-stat-lbl">Avg. Session</p>
              </div>
            </div>
          </div>

          {/* Session list */}
          <div className="db-card db-sessions-card">
            <p className="db-card-title">Recent Sessions</p>
            {sessionsLoading && <p style={{ color: "#94a3b8", padding: "12px 0" }}>Loading…</p>}
            {!sessionsLoading && sessions.length === 0 && (
              <div className="db-empty-state">
                <Clock size={28} />
                <p>No sessions recorded yet</p>
                <button className="db-outline-btn" onClick={() => navigate("/fullbody")}>
                  Start Assessment
                </button>
              </div>
            )}
            {sessions.slice(0, 5).map(s => (
              <div key={s._id || s.id} className="db-session-item">
                <div className="db-session-item-left">
                  <div className="db-info-icon db-icon-blue" style={{ width: 38, height: 38 }}><Zap size={15} /></div>
                  <div>
                    <p className="db-session-item-title">Acupressure Assessment</p>
                    <p className="db-session-item-meta">
                      <MapPin size={11} style={{ display: "inline", marginRight: 3 }} />
                      {s.bodyPart || s.area || "—"}
                    </p>
                  </div>
                </div>
                <div className="db-session-item-right">
                  <span className={`db-sev-badge db-sev-${SEVERITY_COLOR(s.severity)}`}>
                    {SEVERITY_LABEL(s.severity)}
                  </span>
                  <span className="db-session-date">{fmtDate(s.createdAt || s.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ REPORTS TAB ══════════ */}
      {activeTab === "reports" && (
        <div className="db-page">
          <div className="db-page-header">
            <div>
              <h1 className="db-page-title">Reports</h1>
              <p className="db-page-sub">Insights from your pain and recovery data</p>
            </div>
          </div>

          <div className="db-reports-grid">
            {/* Pain Frequency */}
            <div className="db-card">
              <p className="db-card-title">Pain Area Frequency</p>
              {sessions.length === 0 ? (
                <div className="db-empty-state"><BarChart2 size={24} /><p>No data yet</p></div>
              ) : (() => {
                const freq = {};
                sessions.forEach(s => {
                  const key = s.bodyPart || s.area || "Unknown";
                  freq[key] = (freq[key] || 0) + 1;
                });
                const items = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
                const max = items[0]?.[1] || 1;
                return (
                  <div className="db-freq-list">
                    {items.map(([area, count]) => (
                      <div key={area} className="db-freq-row">
                        <span className="db-freq-label">{area}</span>
                        <div className="db-freq-bar-wrap">
                          <div className="db-freq-bar">
                            <div className="db-freq-fill" style={{ width: `${(count / max) * 100}%` }} />
                          </div>
                          <span className="db-freq-count">{count}x</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Severity Trend */}
            <div className="db-card">
              <p className="db-card-title">Severity Trend</p>
              {sessions.length === 0 ? (
                <div className="db-empty-state"><TrendingUp size={24} /><p>No data yet</p></div>
              ) : (
                <div className="db-trend-list">
                  {sessions.slice(0, 8).map(s => (
                    <div key={s._id || s.id} className="db-trend-row">
                      <span className="db-trend-date">{fmtDate(s.createdAt || s.date)}</span>
                      <div className="db-trend-bar-wrap">
                        <div className="db-trend-bar">
                          <div
                            className={`db-trend-fill db-fill-${SEVERITY_COLOR(s.severity)}`}
                            style={{ width: `${s.severity * 10}%` }}
                          />
                        </div>
                        <span className="db-trend-val">{s.severity}/10</span>
                      </div>
                      <span className="db-trend-area">{s.bodyPart || s.area || "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medical Conditions */}
            <div className="db-card">
              <p className="db-card-title">Medical Conditions Overview</p>
              {totalConds > 0 ? (
                <div className="db-cond-list">
                  {activeSections.map(section => {
                    const Icon = section.icon;
                    const conds = medicalHistory[section.key] || [];
                    return (
                      <div key={section.key} className="db-cond-row">
                        <div className={`db-info-icon db-icon-${section.color}`} style={{ width: 32, height: 32, borderRadius: 8 }}>
                          <Icon size={14} />
                        </div>
                        <div className="db-cond-body">
                          <p className="db-cond-label">{section.label}</p>
                          <div className="db-mh-tags">
                            {conds.map(c => (
                              <span key={c} className={`db-mh-tag db-tag-${section.color}`}>{c}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="db-empty-state">
                  <FileText size={28} />
                  <p>No medical history recorded</p>
                  <button className="db-outline-btn" onClick={() => navigate("/medical-history")}>
                    Add Medical History
                  </button>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            <div className="db-card">
              <p className="db-card-title">All-time Summary</p>
              <div className="db-monthly-grid">
                <div className="db-monthly-stat">
                  <span className="db-monthly-val">{statsData?.totalAssessments ?? sessions.length}</span>
                  <span className="db-monthly-lbl">Assessments</span>
                </div>
                <div className="db-monthly-stat">
                  <span className="db-monthly-val db-col-amber">
                    {statsData?.averageSeverity != null
                      ? statsData.averageSeverity.toFixed(1)
                      : sessions.length
                        ? (sessions.reduce((a, s) => a + s.severity, 0) / sessions.length).toFixed(1)
                        : "—"}
                  </span>
                  <span className="db-monthly-lbl">Avg. Severity</span>
                </div>
                <div className="db-monthly-stat">
                  <span className="db-monthly-val db-col-rose">
                    {sessions.filter(s => SEVERITY_COLOR(s.severity) === "rose").length}
                  </span>
                  <span className="db-monthly-lbl">Severe Events</span>
                </div>
                <div className="db-monthly-stat">
                  <span className="db-monthly-val db-col-green">
                    {sessions.filter(s => SEVERITY_COLOR(s.severity) === "green").length}
                  </span>
                  <span className="db-monthly-lbl">Mild Events</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ EXERCISE LIBRARY TAB ══════════ */}
      {activeTab === "exercises" && (
        <div className="db-page">
          <div className="db-page-header">
            <div>
              <h1 className="db-page-title">Exercise Library</h1>
              <p className="db-page-sub">Acupressure techniques and guided exercises</p>
            </div>
          </div>

          <div className="db-search-bar">
            <Search size={15} className="db-search-icon" />
            <input
              type="text"
              placeholder="Search exercises…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="db-search-input"
            />
          </div>

          <div className="db-exercise-grid">
            {filteredExercises.length === 0 && exercises.length === 0 && (
              <div className="db-empty-state db-full-width">
                <BookOpen size={32} />
                <p>Loading exercises…</p>
              </div>
            )}
            {filteredExercises.length === 0 && exercises.length > 0 && (
              <div className="db-empty-state db-full-width">
                <Search size={28} />
                <p>No exercises match "{searchTerm}"</p>
              </div>
            )}
            {filteredExercises.map((ex, i) => (
              <div key={i} className="db-exercise-card db-card">
                <div className="db-exercise-header">
                  <div className="db-info-icon db-icon-blue" style={{ width: 38, height: 38 }}><Bone size={16} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="db-exercise-name">
                      {ex.name.replace(/\b\w/g, c => c.toUpperCase())}
                    </p>
                    <div className="db-ex-points">
                      {ex.acupressure_points?.map(pt => (
                        <span key={pt} className="db-point-tag">{pt}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {ex.instructions && (
                  <p className="db-exercise-detail">{ex.instructions}</p>
                )}
                {ex.precautions && (
                  <div className="db-exercise-precaution">
                    <AlertTriangle size={11} />
                    <span>{ex.precautions}</span>
                  </div>
                )}
                <button className="db-ex-btn" onClick={() => navigate("/fullbody")}>
                  <Play size={12} /> Start Session
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
