import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import "../styles/Headsymptomsview.css"; // Reusing same CSS

export default function PainTypeView({ onBack, onContinue }) {
  const [selectedPainTypes, setSelectedPainTypes] = useState([]);

  const painTypes = [
    "Throbbing",
    "Sharp/Stabbing",
    "Dull/Aching",
    "Burning",
    "Tingling",
    "Pressure",
    "Cramping",
    "Shooting",
    "Chronic (long-term)",
    "Acute (sudden)",
    "Intermittent (comes and goes)",
    "Constant"
  ];

  const togglePainType = (type) => {
    setSelectedPainTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleContinue = () => {
    if (selectedPainTypes.length === 0) {
      alert("Please select at least one pain type!");
      return;
    }
    
    console.log("✅ Pain types selected:", selectedPainTypes);
    onContinue(selectedPainTypes);
  };

  return (
    <div className="symptoms-container">
      <div className="symptoms-wrapper">
        {/* Header with Back Button */}
        <div className="back-button-section">
          <button onClick={onBack} className="back-button">
            <div className="back-icon-circle">
              <ArrowLeft size={20} />
            </div>
            <span className="back-text">Back to Symptoms</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="symptoms-card">
          {/* Title Section */}
          <div className="title-section">
            <h1 className="main-title">What type of pain are you experiencing?</h1>
            <p className="subtitle">Select all pain types that apply.</p>
          </div>

          {/* Pain Types List */}
          <div className="symptoms-list">
            {painTypes.map((type, index) => (
              <label key={index} className="symptom-item">
                <span className="symptom-label">{type}</span>
                <input
                  type="checkbox"
                  checked={selectedPainTypes.includes(type)}
                  onChange={() => togglePainType(type)}
                  className="symptom-checkbox"
                />
              </label>
            ))}
          </div>

          {/* Continue Button */}
          <button 
            onClick={handleContinue} 
            className="continue-button"
            disabled={selectedPainTypes.length === 0}
            style={{
              opacity: selectedPainTypes.length === 0 ? 0.5 : 1,
              cursor: selectedPainTypes.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Continue ({selectedPainTypes.length} selected)
          </button>
        </div>
      </div>
    </div>
  );
}