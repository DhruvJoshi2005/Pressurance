import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HumanViewer from "./HumanViewer";
import HeadView from "./HeadView";
import TrunkView from "./TrunkView";
import LegsView from "./LegsView";
import LeftHandView from "./LeftHandView";
import RightHandView from "./RightHandView";
import HeadSymptomsView from "./Headsymptomsview";
import { Activity, ArrowLeft, ChevronRight, MousePointerClick } from "lucide-react";
import "./../styles/FullBodyView.css";

export default function FullBodyView() {
  const [currentView, setCurrentView] = useState("fullBody");
  const [selectedZone, setSelectedZone] = useState(null);
  const navigate = useNavigate();

  const handlePartClick = (partName) => {
    if (currentView !== "fullBody") return;
    const map = {
      Head: "head",
      Trunk: "trunk",
      Legs: "legs",
      LeftHand: "leftHand",
      RightHand: "rightHand",
    };
    if (map[partName]) setCurrentView(map[partName]);
  };

  const handleBackToFullBody = () => setCurrentView("fullBody");

  const handleZoneSelected = (zone) => {
    setSelectedZone(zone);
    setCurrentView("headSymptoms");
  };

  // "Continue" button always routes through HeadView to ensure a zone is selected
  const handleContinue = () => setCurrentView("head");

  if (currentView === "headSymptoms") return (
    <HeadSymptomsView onBack={() => setCurrentView("head")} zone={selectedZone} />
  );
  if (currentView === "head") return (
    <HeadView onBack={handleBackToFullBody} onZoneSelected={handleZoneSelected} />
  );
  if (currentView === "trunk")     return <TrunkView     onBack={handleBackToFullBody} />;
  if (currentView === "legs")      return <LegsView      onBack={handleBackToFullBody} />;
  if (currentView === "leftHand")  return <LeftHandView  onBack={handleBackToFullBody} />;
  if (currentView === "rightHand") return <RightHandView onBack={handleBackToFullBody} />;

  return (
    <div className="fbv-root">
      {/* Header */}
      <header className="fbv-header">
        <div className="fbv-header-left">
          <button className="fbv-back-btn" onClick={() => navigate("/Accudashboard")}>
            <ArrowLeft size={18} />
          </button>
          <div className="fbv-logo">
            <Activity size={20} strokeWidth={2.5} />
            <span>Pressurance</span>
          </div>
        </div>

        <div className="fbv-steps">
          <div className="fbv-step fbv-step--done">
            <span className="fbv-step-num">1</span>
            <span className="fbv-step-label">Body Area</span>
          </div>
          <div className="fbv-step-line" />
          <div className="fbv-step fbv-step--next">
            <span className="fbv-step-num">2</span>
            <span className="fbv-step-label">Symptoms</span>
          </div>
          <div className="fbv-step-line" />
          <div className="fbv-step fbv-step--next">
            <span className="fbv-step-num">3</span>
            <span className="fbv-step-label">Pain Type</span>
          </div>
          <div className="fbv-step-line" />
          <div className="fbv-step fbv-step--next">
            <span className="fbv-step-num">4</span>
            <span className="fbv-step-label">Severity</span>
          </div>
        </div>

        <button className="fbv-continue-btn" onClick={handleContinue}>
          Continue <ChevronRight size={16} />
        </button>
      </header>

      {/* Body */}
      <main className="fbv-main">
        <div className="fbv-hint">
          <MousePointerClick size={15} />
          <span>Click on a body part to zoom in and select your pain area</span>
        </div>

        <div className="fbv-viewer-card">
          <HumanViewer onPartClick={handlePartClick} />
        </div>
      </main>
    </div>
  );
}
