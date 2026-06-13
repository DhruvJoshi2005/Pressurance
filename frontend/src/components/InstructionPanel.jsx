import React from 'react';
import '../styles/InstructionPanel.css';

const InstructionPanel = ({ guide, sessionStatus }) => {
  if (!guide) {
    return (
      <div className="instruction-panel">
        <h2>Instructions</h2>
        <p>Please select a pain type to view instructions.</p>
      </div>
    );
  }
  
  const { pain_type, steps } = guide;
  
  // If there's an active session, show the current step information
  if (sessionStatus && sessionStatus.is_active) {
    const currentStepIndex = sessionStatus.current_step;
    const currentStep = steps[currentStepIndex];
    
    return (
      <div className="instruction-panel active-session">
        <h2>Current Session: {pain_type}</h2>
        <div className="session-progress">
          <p className="step-indicator">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="current-step">
          <h3>{currentStep.name}</h3>
          <p><strong>Location:</strong> {currentStep.location}</p>
          <p><strong>How:</strong> {currentStep.how}</p>
          <p><strong>Precaution:</strong> {currentStep.precaution}</p>
          <div className="timer">
            <span className="timer-value">{sessionStatus.remaining_time}</span>
            <span className="timer-label">seconds remaining</span>
          </div>
        </div>
      </div>
    );
  }
  
  // If no active session, show all steps for the selected pain type
  return (
    <div className="instruction-panel">
      <h2>Instructions for: {pain_type}</h2>
      <div className="steps-list">
        {steps.map((step, index) => (
          <div key={index} className="step-item">
            <h3>Step {index + 1}: {step.name}</h3>
            <p><strong>Location:</strong> {step.location}</p>
            <p><strong>Duration:</strong> {step.duration} seconds</p>
            <p><strong>How:</strong> {step.how}</p>
            <p><strong>Precaution:</strong> {step.precaution}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstructionPanel;