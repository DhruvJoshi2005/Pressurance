import React, { useState } from 'react';

// Simplified HeadView component for demonstration
function HeadView({ onBack }) {
  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <h1>Head Detail View</h1>
      <p>This would show your detailed head model with pain zones</p>
      <button 
        onClick={onBack}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          background: '#fff',
          color: '#333',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Back to Full Body View
      </button>
    </div>
  );
}

// Import the fixed HumanViewer
import HumanViewer from './HumanViewer';

export default function MainApp() {
  const [currentView, setCurrentView] = useState('fullBody');
  
  const handlePartClick = (partName) => {
    console.log(`Part clicked: ${partName}`);
    
    // Navigate based on which part was clicked
    switch(partName) {
      case 'Head':
        console.log('Navigating to Head view');
        setCurrentView('head');
        break;
      case 'Right_Hand':
        console.log('Navigating to Hand view');
        setCurrentView('hand');
        break;
      case 'Left_Hand':
        console.log('Navigating to Hand view');
        setCurrentView('hand');
        break;
      default:
        console.log(`No specific view for ${partName}`);
    }
  };

  const handleBackToFullBody = () => {
    setCurrentView('fullBody');
  };

  // Render current view based on state
  if (currentView === 'head') {
    return <HeadView onBack={handleBackToFullBody} />;
  }
  
  if (currentView === 'hand') {
    return (
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <h1>Hand Detail View</h1>
        <p>This would show your detailed hand model</p>
        <button 
          onClick={handleBackToFullBody}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            background: '#fff',
            color: '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Back to Full Body View
        </button>
      </div>
    );
  }

  // Default full body view
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        background: 'rgba(255,255,255,0.9)',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Instructions:</h3>
        <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>• Click on the head to view head details</p>
        <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>• Click on hands to view hand details</p>
        <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>• The model will zoom before transitioning</p>
      </div>
      <HumanViewer onPartClick={handlePartClick} />
    </div>
  );
}