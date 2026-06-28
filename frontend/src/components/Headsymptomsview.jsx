import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import "../styles/Headsymptomsview.css";
import PainTypeView from "./PainTypeView";
import PainSeverityView from "./PainSeverityView_FastAPI";
import MigraineAuraCheck from "./MigraineAuraCheck";

// Zones where migraine subtype classification is clinically meaningful
const MIGRAINE_ZONES = new Set([
  "Temple_Left", "Temple_Right",
  "Mid_Forehead_Pain",
  "Forehead_Left", "Forehead_Right",
  "Skull_Pain",
]);

export default function Headsymptomsview({ onBack, zone }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [otherText, setOtherText]               = useState("");
  const [currentStep, setCurrentStep]           = useState("symptoms");
  const [painTypeData, setPainTypeData]         = useState(null);
  const [auraData, setAuraData]                 = useState(null);

  const isMigraineZone = MIGRAINE_ZONES.has(zone);

  const symptoms = [
    "Dull forehead ache",
    "Eye strain pain",
    "Sinus pressure",
    "Light/noise sensitivity",
    "Band-like tension",
    "Stress or lack of sleep",
    "Sudden severe headache",
    "Nausea / vomiting",
    "Blurred or double vision",
    "Dizziness or confusion",
    "Lasts > 3 days",
    "Fever or stiff neck",
    "Numbness / weakness",
    "After injury",
  ];

  const toggleSymptom = (symptom) =>
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );

  const handleContinue = () => {
    if (selectedSymptoms.length === 0 && !otherText.trim()) {
      alert("Please select at least one symptom or describe your symptom!");
      return;
    }
    setCurrentStep("painType");
  };

  const handlePainTypeContinue = (selectedPainTypes) => {
    setPainTypeData(selectedPainTypes);
    // Insert aura check only for migraine zones
    setCurrentStep(isMigraineZone ? "aura" : "severity");
  };

  const handleAuraContinue = (collectedAura) => {
    setAuraData(collectedAura);
    setCurrentStep("severity");
  };

  const handleAuraSkip = () => {
    setAuraData(null);
    setCurrentStep("severity");
  };

  const handleSeverityComplete = () => {
    setCurrentStep("symptoms");
    setSelectedSymptoms([]);
    setOtherText("");
    setPainTypeData(null);
    setAuraData(null);
  };

  // ── Step: Aura Check (migraine zones only) ─────────────────────────────
  if (currentStep === "aura") {
    return (
      <MigraineAuraCheck
        onBack={() => setCurrentStep("painType")}
        onContinue={handleAuraContinue}
        onSkip={handleAuraSkip}
      />
    );
  }

  // ── Step: Severity ─────────────────────────────────────────────────────
  if (currentStep === "severity") {
    const symptomsData = { symptoms: selectedSymptoms, other: otherText, bodyPart: "Head" };
    return (
      <PainSeverityView
        onBack={() => setCurrentStep(isMigraineZone ? "aura" : "painType")}
        onComplete={handleSeverityComplete}
        symptomsData={symptomsData}
        painTypeData={painTypeData}
        auraData={auraData}
        zone={zone}
      />
    );
  }

  // ── Step: Pain Type ────────────────────────────────────────────────────
  if (currentStep === "painType") {
    return (
      <PainTypeView
        onBack={() => setCurrentStep("symptoms")}
        onContinue={handlePainTypeContinue}
      />
    );
  }

  // ── Step: Symptoms (default) ───────────────────────────────────────────
  return (
    <div className="symptoms-container">
      <div className="symptoms-wrapper">
        <div className="back-button-section">
          <button onClick={onBack} className="back-button">
            <div className="back-icon-circle">
              <ArrowLeft size={20} />
            </div>
            <span className="back-text">Back to Choosing Pain Area</span>
          </button>
        </div>

        <div className="symptoms-card">
          <div className="title-section">
            <h1 className="main-title">Tell us what you're feeling</h1>
            <p className="subtitle">Select the symptoms that best describe your pain.</p>
          </div>

          <div className="symptoms-list">
            {symptoms.map((symptom, index) => (
              <label key={index} className="symptom-item">
                <span className="symptom-label">{symptom}</span>
                <input
                  type="checkbox"
                  checked={selectedSymptoms.includes(symptom)}
                  onChange={() => toggleSymptom(symptom)}
                  className="symptom-checkbox"
                />
              </label>
            ))}

            <div className="other-symptom">
              <div className="other-label">
                <span>Other, then specify:</span>
              </div>
              <input
                type="text"
                value={otherText}
                onChange={e => setOtherText(e.target.value)}
                placeholder="Describe your symptom..."
                className="other-input"
              />
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="continue-button"
            disabled={selectedSymptoms.length === 0 && !otherText.trim()}
            style={{
              opacity: (selectedSymptoms.length === 0 && !otherText.trim()) ? 0.5 : 1,
              cursor:  (selectedSymptoms.length === 0 && !otherText.trim()) ? "not-allowed" : "pointer",
            }}
          >
            Continue ({selectedSymptoms.length} symptoms)
          </button>
        </div>
      </div>
    </div>
  );
}
