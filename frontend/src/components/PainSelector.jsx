import React from 'react';
import '../styles/PainSelector.css';

const PainSelector = ({ painTypes, selectedPain, onPainChange, disabled }) => {
  return (
    <div className="pain-selector">
      <h2>Select Pain Type</h2>
      <select 
        value={selectedPain} 
        onChange={(e) => onPainChange(e.target.value)}
        disabled={disabled}
        className="pain-dropdown"
      >
        {painTypes.map((pain, index) => (
          <option key={index} value={pain}>
            {pain}
          </option>
        ))}
      </select>
      
      {disabled && (
        <p className="selection-disabled">
          Selection disabled during active session
        </p>
      )}
    </div>
  );
};

export default PainSelector;