import { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import {
  Activity, Brain, Heart, Wind, Utensils,
  Bone, Dumbbell, PersonStanding, ChevronDown, ChevronUp,
  CheckCircle2, Circle, ArrowRight, SkipForward,
} from "lucide-react";
import "./../styles/MedicalHistory.css";

const BODY_SECTIONS = [
  {
    key: "head_neck",
    label: "Head & Neck",
    icon: Brain,
    color: "violet",
    conditions: [
      "Migraine / Chronic Headaches",
      "Sinusitis / Sinus Congestion",
      "Cervical Spondylosis (Neck Stiffness)",
      "Vertigo / Dizziness",
      "Tinnitus (Ringing in Ears)",
      "TMJ / Jaw Pain",
    ],
  },
  {
    key: "chest_heart",
    label: "Chest & Heart",
    icon: Heart,
    color: "rose",
    conditions: [
      "Coronary Artery Disease",
      "Hypertension (High Blood Pressure)",
      "Heart Arrhythmia / Palpitations",
      "Angina (Chest Pain)",
      "Heart Attack (History)",
      "Congenital Heart Condition",
    ],
  },
  {
    key: "respiratory",
    label: "Lungs & Respiratory",
    icon: Wind,
    color: "blue",
    conditions: [
      "Asthma",
      "COPD / Chronic Bronchitis",
      "Sleep Apnea",
      "Pleuritis / Lung Inflammation",
      "Frequent Chest Infections",
      "GERD / Acid Reflux",
    ],
  },
  {
    key: "abdomen",
    label: "Abdomen & Digestive",
    icon: Utensils,
    color: "amber",
    conditions: [
      "IBS (Irritable Bowel Syndrome)",
      "Gastritis / Peptic Ulcer",
      "Kidney Stones",
      "Fatty Liver / Liver Disease",
      "Crohn's Disease / Colitis",
      "Appendix Surgery (History)",
    ],
  },
  {
    key: "spine_back",
    label: "Spine & Back",
    icon: Bone,
    color: "orange",
    conditions: [
      "Lower Back Pain (Chronic)",
      "Herniated / Slipped Disc",
      "Sciatica",
      "Scoliosis",
      "Ankylosing Spondylitis",
      "Osteoporosis / Bone Density Loss",
    ],
  },
  {
    key: "shoulders_arms",
    label: "Shoulders & Arms",
    icon: Dumbbell,
    color: "teal",
    conditions: [
      "Frozen Shoulder",
      "Rotator Cuff Tear / Injury",
      "Tennis Elbow / Golfer's Elbow",
      "Carpal Tunnel Syndrome",
      "Shoulder Dislocation (History)",
      "Bursitis",
    ],
  },
  {
    key: "hips_legs",
    label: "Hips & Legs",
    icon: PersonStanding,
    color: "green",
    conditions: [
      "Hip Osteoarthritis",
      "Knee Pain / ACL Injury",
      "Varicose Veins",
      "Plantar Fasciitis (Heel Pain)",
      "Gout",
      "DVT (Deep Vein Thrombosis)",
    ],
  },
  {
    key: "systemic",
    label: "General / Systemic",
    icon: Activity,
    color: "indigo",
    conditions: [
      "Type 2 Diabetes",
      "Thyroid Disorder (Hypo/Hyper)",
      "Fibromyalgia",
      "Rheumatoid Arthritis",
      "Lupus / Autoimmune Disorder",
      "Obesity / Metabolic Syndrome",
    ],
  },
];

export default function MedicalHistory() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState({});
  const [expanded, setExpanded] = useState({ head_neck: true });
  const [loading, setLoading] = useState(false);

  const toggle = (sectionKey, condition) => {
    setSelected(prev => {
      const current = prev[sectionKey] || [];
      return {
        ...prev,
        [sectionKey]: current.includes(condition)
          ? current.filter(c => c !== condition)
          : [...current, condition],
      };
    });
  };

  const toggleSection = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalSelected = Object.values(selected).flat().length;

  const handleSubmit = async () => {
    setLoading(true);
    localStorage.setItem("medicalHistory", JSON.stringify(selected));
    try {
      await api.post("/auth/medical-history", { conditions: selected });
      await api.post("/humanModel/start-session", {});

      navigate("/Accudashboard");
    } catch (err) {
      console.error(err);
      navigate("/Accudashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await api.post("/humanModel/start-session", {});
    } catch {}
    navigate("/Accudashboard");
  };

  return (
    <div className="mh-root">
      {/* Header */}
      <header className="mh-header">
        <div className="mh-logo">
          <Activity size={22} strokeWidth={2.5} />
          <span>Pressurance</span>
        </div>
        <div className="mh-steps">
          <span className="mh-step mh-step--done">Account Created</span>
          <span className="mh-step-arrow">›</span>
          <span className="mh-step mh-step--active">Health History</span>
          <span className="mh-step-arrow">›</span>
          <span className="mh-step mh-step--next">Dashboard</span>
        </div>
        <button className="mh-skip-btn" onClick={handleSkip}>
          Skip for now <SkipForward size={14} />
        </button>
      </header>

      {/* Page title */}
      <div className="mh-hero">
        <h1 className="mh-title">Tell us about your health history</h1>
        <p className="mh-subtitle">
          Select any past or ongoing conditions. Our AI uses this to personalise
          your pain assessment and recommendations. You can update this anytime.
        </p>
        {totalSelected > 0 && (
          <div className="mh-selected-pill">
            <CheckCircle2 size={14} />
            {totalSelected} condition{totalSelected !== 1 ? "s" : ""} selected
          </div>
        )}
      </div>

      {/* Sections grid */}
      <main className="mh-main">
        {BODY_SECTIONS.map(section => {
          const Icon = section.icon;
          const sectionSelected = selected[section.key] || [];
          const isOpen = !!expanded[section.key];

          return (
            <div key={section.key} className={`mh-section mh-section--${section.color}`}>
              <button
                className="mh-section-header"
                onClick={() => toggleSection(section.key)}
              >
                <div className="mh-section-left">
                  <div className={`mh-section-icon mh-icon--${section.color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="mh-section-label">{section.label}</span>
                  {sectionSelected.length > 0 && (
                    <span className="mh-count-badge">{sectionSelected.length}</span>
                  )}
                </div>
                {isOpen ? <ChevronUp size={18} className="mh-chevron" /> : <ChevronDown size={18} className="mh-chevron" />}
              </button>

              {isOpen && (
                <div className="mh-conditions">
                  {section.conditions.map(condition => {
                    const checked = sectionSelected.includes(condition);
                    return (
                      <button
                        key={condition}
                        className={`mh-condition-btn ${checked ? "mh-condition-btn--checked" : ""}`}
                        onClick={() => toggle(section.key, condition)}
                      >
                        {checked
                          ? <CheckCircle2 size={16} className="mh-check-icon mh-check-icon--on" />
                          : <Circle size={16} className="mh-check-icon" />
                        }
                        <span>{condition}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* Footer CTA */}
      <div className="mh-footer">
        <button className="mh-footer-skip" onClick={handleSkip}>
          Skip for now
        </button>
        <button className="mh-footer-submit" onClick={handleSubmit} disabled={loading}>
          {loading
            ? <span className="btn-spinner" />
            : <><span>Continue to Dashboard</span><ArrowRight size={16} /></>
          }
        </button>
      </div>
    </div>
  );
}
