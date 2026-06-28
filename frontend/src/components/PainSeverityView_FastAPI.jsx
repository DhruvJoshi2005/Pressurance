import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import "../styles/PainSeverityView.css";

export default function PainSeverityView({ onBack, onComplete, symptomsData, painTypeData }) {
  const [severity, setSeverity] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const painData = {
      symptoms: symptomsData?.symptoms || [],
      otherSymptom: symptomsData?.other || null,
      painTypes: painTypeData || [],
      severity: severity,
      bodyPart: symptomsData?.bodyPart || "Head"
    };

    console.log("Submitting pain data:", painData);

    try {
      // ✅ FIXED: Get correct token key
      const token = localStorage.getItem('token');

      if (!token) {
        alert("Please login first");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('http://localhost:8000/pain/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(painData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Successfully saved:", result);
        alert("Pain assessment saved successfully!");

        if (onComplete) {
          onComplete(result);
        }
      } else {
        const error = await response.json();
        console.error("❌ Failed to save:", error);
        alert(`Failed to save: ${error.detail || "Unknown error"}`);
      }

    } catch (error) {
      console.error("❌ Error saving data:", error);
      alert("Error connecting to server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="severity-container">
      <div className="severity-wrapper">

        <div className="severity-back-section">
          <button onClick={onBack} className="severity-back-button">
            <div className="severity-back-icon">
              <ArrowLeft size={20} />
            </div>
            <span className="severity-back-text">Back to Pain Type</span>
          </button>
        </div>

        <div className="severity-card">
          <div className="severity-title-section">
            <h1 className="severity-main-title">Rate your pain severity</h1>
            <p className="severity-subtitle">Use the slider to indicate how severe your pain is.</p>
          </div>

          <div className="severity-slider-container">
            <div className="severity-value-display">
              <span className="severity-number">{severity}</span>
              <span className="severity-label">
                {severity <= 3 ? "Mild" : severity <= 6 ? "Moderate" : "Severe"}
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              className="severity-slider"
            />

            <div className="severity-scale-labels">
              <span>1 - No Pain</span>
              <span>10 - Worst Pain</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="severity-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Submit Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
}
