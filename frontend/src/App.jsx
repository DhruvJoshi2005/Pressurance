import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Login';
import Signup from './components/Signup';
import LandingPage from './components/LandingPage';
import MedicalHistory from './components/MedicalHistory';
import WebcamStream from './components/WebcamStream';
import PainSelector from './components/PainSelector';
import AccuDashboard from './components/AccuDashboard';
import InstructionPanel from './components/InstructionPanel';
import ThreeDViewer from './components/ThreeDViewer';
import FullBodyView from "./components/FullBodyView";

import './styles/App.css';
import axios from 'axios';

const flaskUrl = 'http://localhost:5001';

function Dashboard() {
  const [painTypes, setPainTypes] = useState([]);
  const [selectedPain, setSelectedPain] = useState('');
  const [currentGuide, setCurrentGuide] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStatus, setSessionStatus] = useState(null);

  useEffect(() => {
    const fetchPainTypes = async () => {
      try {
        const response = await axios.get(`${flaskUrl}/api/pain_types`);
        setPainTypes(response.data);
      } catch (error) {
        console.error('Error fetching pain types:', error);
      }
    };
    fetchPainTypes();
  }, []);

  useEffect(() => {
    if (selectedPain) {
      const fetchGuide = async () => {
        try {
          const response = await axios.get(`${flaskUrl}/api/acupressure_guide/${selectedPain}`);
          setCurrentGuide(response.data);
        } catch (error) {
          console.error('Error fetching guide:', error);
        }
      };
      fetchGuide();
    }
  }, [selectedPain]);

  useEffect(() => {
    let intervalId;

    if (sessionActive) {
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(`${flaskUrl}/api/session_status`);
          setSessionStatus(response.data);

          if (!response.data.is_active && sessionActive) {
            setSessionActive(false);
            setSessionStatus(null);
          }
        } catch (error) {
          console.error('Error fetching session status:', error);
        }
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionActive]);

  const handlePainChange = (painType) => {
    setSelectedPain(painType);
  };

  const startSession = async () => {
    try {
      await axios.post(`${flaskUrl}/api/start_session`, { pain_type: selectedPain });
      setSessionActive(true);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const stopSession = async () => {
    try {
      await axios.post(`${flaskUrl}/api/stop_session`);
      setSessionActive(false);
      setSessionStatus(null);
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Acupressure Guidance System</h1>
      </header>

      <main className="main-content">
        <div className="left-panel">
          <PainSelector
            painTypes={painTypes}
            selectedPain={selectedPain}
            onPainChange={handlePainChange}
            disabled={sessionActive}
          />

          <div className="session-controls">
            {!sessionActive ? (
              <button className="start-button" onClick={startSession} disabled={!selectedPain}>
                Start Session
              </button>
            ) : (
              <button className="stop-button" onClick={stopSession}>
                Stop Session
              </button>
            )}
          </div>

          <InstructionPanel guide={currentGuide} sessionStatus={sessionStatus} />
        </div>

        <div className="right-panel">
          <WebcamStream />
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2025 Acupressure Guidance App</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/medical-history" element={<MedicalHistory />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/Accudashboard" element={<AccuDashboard />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/3d" element={<ThreeDViewer />} />
        <Route path="/fullbody" element={<FullBodyView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
