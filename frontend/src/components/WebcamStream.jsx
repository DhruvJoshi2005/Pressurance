import React, { useEffect, useState } from 'react';
import '../styles/WebcamStream.css';

const WebcamStream = () => {
  const [streamActive, setStreamActive] = useState(false);
  const [flaskPort, setFlaskPort] = useState(5001); // Use the port your Flask is actually running on
  
  useEffect(() => {
    setStreamActive(true);
    return () => {
      setStreamActive(false);
    };
  }, []);
  
  return (
    <div className="webcam-container">
      <h2>Webcam Feed</h2>
      <div className="video-container">
        {streamActive ? (
          <img 
            src={`http://localhost:${flaskPort}/video_feed`}
            alt="Webcam Stream" 
            className="webcam-stream" 
          />
        ) : (
          <div className="loading-message">
            Loading webcam feed...
          </div>
        )}
      </div>
      <div className="webcam-info">
        <p>Place your face in the frame for accurate acupressure point detection</p>
      </div>
    </div>
  );
};

export default WebcamStream;