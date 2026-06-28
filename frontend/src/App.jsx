import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login                  from './components/Login';
import Signup                 from './components/Signup';
import LandingPage            from './components/LandingPage';
import MedicalHistory         from './components/MedicalHistory';
import AccuDashboard          from './components/AccuDashboard';
import FullBodyView           from './components/FullBodyView';
import AccupressureRecommendation from './components/AccupressureRecommendation';
import FaceAcupressureDemo    from './components/FaceAcupressureDemo';
import SimpleGuidedSession    from './components/SimpleGuidedSession';
import SessionFeedback        from './components/SessionFeedback';
import GuidedAcupressureSession from './components/GuidedAcupressureSession';

import './styles/App.css';

// Redirects unauthenticated users to /login
function ProtectedRoute({ children }) {
  return localStorage.getItem("token")
    ? children
    : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"       element={<LandingPage />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected */}
        <Route path="/medical-history" element={<ProtectedRoute><MedicalHistory /></ProtectedRoute>} />
        <Route path="/Accudashboard"   element={<ProtectedRoute><AccuDashboard /></ProtectedRoute>} />
        <Route path="/fullbody"        element={<ProtectedRoute><FullBodyView /></ProtectedRoute>} />
        <Route path="/session"         element={<ProtectedRoute><GuidedAcupressureSession /></ProtectedRoute>} />
        <Route path="/session-feedback" element={<ProtectedRoute><SessionFeedback /></ProtectedRoute>} />
        <Route path="/guided-session"  element={<ProtectedRoute><SimpleGuidedSession /></ProtectedRoute>} />
        <Route path="/recommendation"  element={<ProtectedRoute><AccupressureRecommendation /></ProtectedRoute>} />
        <Route path="/live-demo"       element={<ProtectedRoute><FaceAcupressureDemo /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
