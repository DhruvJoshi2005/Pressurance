import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import "../styles/Headsymptomsview.css";
import PainTypeView from "./PainTypeView";  // ✅ FIXED - Correct import
import PainSeverityView from "./PainSeverityView_FastAPI";

export default function Headsymptomsview({ onBack }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [otherText, setOtherText] = useState("");
  const [currentStep, setCurrentStep] = useState("symptoms");
  const [painTypeData, setPainTypeData] = useState(null);

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
    "After injury"
  ];

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleContinue = () => {
    if (selectedSymptoms.length === 0 && !otherText.trim()) {
      alert("Please select at least one symptom or describe your symptom!");
      return;
    }
    
    console.log("✅ Selected symptoms:", selectedSymptoms);
    console.log("✅ Other text:", otherText);
    setCurrentStep("painType");
  };

  const handleBackToSymptoms = () => {
    console.log("⬅️ Going back to symptoms");
    setCurrentStep("symptoms");
  };

  const handlePainTypeContinue = (selectedPainTypes) => {
    console.log("✅ Pain types selected:", selectedPainTypes);
    setPainTypeData(selectedPainTypes);
    setCurrentStep("severity");
  };

  const handleBackToPainType = () => {
    console.log("⬅️ Going back to pain type");
    setCurrentStep("painType");
  };

  const handleSeverityComplete = (result) => {
    console.log("✅ Assessment completed:", result);
    alert("Pain assessment saved successfully!");
    // Reset to beginning
    setCurrentStep("symptoms");
    setSelectedSymptoms([]);
    setOtherText("");
    setPainTypeData(null);
  };

  // Step 3: Severity View
  if (currentStep === "severity") {
    const symptomsData = {
      symptoms: selectedSymptoms,
      other: otherText,
      bodyPart: "Head"
    };

    console.log("📊 Sending to severity:", { symptomsData, painTypeData });

    return (
      <PainSeverityView
        onBack={handleBackToPainType}
        onComplete={handleSeverityComplete}
        symptomsData={symptomsData}
        painTypeData={painTypeData}
      />
    );
  }

  // Step 2: Pain Type View
  if (currentStep === "painType") {
    return (
      <PainTypeView 
        onBack={handleBackToSymptoms} 
        onContinue={handlePainTypeContinue} 
      />
    );
  }

  // Step 1: Symptoms Selection (default)
  return (
    <div className="symptoms-container">
      <div className="symptoms-wrapper">
        {/* Header with Back Button */}
        <div className="back-button-section">
          <button onClick={onBack} className="back-button">
            <div className="back-icon-circle">
              <ArrowLeft size={20} />
            </div>
            <span className="back-text">Back to Choosing Pain Area</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="symptoms-card">
          {/* Title Section */}
          <div className="title-section">
            <h1 className="main-title">Tell us what you're feeling</h1>
            <p className="subtitle">Select the symptoms that best describe your pain.</p>
          </div>

          {/* Symptoms List */}
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

            {/* Other Option */}
            <div className="other-symptom">
              <div className="other-label">
                <span>Other, then specify:</span>
              </div>
              <input
                type="text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Describe your symptom..."
                className="other-input"
              />
            </div>
          </div>

          {/* Continue Button */}
          <button 
            onClick={handleContinue} 
            className="continue-button"
            disabled={selectedSymptoms.length === 0 && !otherText.trim()}
            style={{
              opacity: (selectedSymptoms.length === 0 && !otherText.trim()) ? 0.5 : 1,
              cursor: (selectedSymptoms.length === 0 && !otherText.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            Continue ({selectedSymptoms.length} symptoms)
          </button>
        </div>
      </div>
    </div>
  );
}