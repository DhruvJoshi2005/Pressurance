import cv2
import mediapipe as mp
import json
import time
import threading
import os

class AcupressureCamera:
    def __init__(self):
        # Initialize webcam
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            raise RuntimeError("Could not open camera")
            
        # Load selected pain
        try:
            with open("selected_pain.txt", "r") as f:
                self.selected_pain = f.read().strip()
        except FileNotFoundError:
            self.selected_pain = "Migraine & Headache"  # Default
            
        # Load acupressure guide
        try:
            with open("acupressure_guide.json", "r") as f:
                self.acupressure_guide = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            self.acupressure_guide = {}
            
        # MediaPipe Face Mesh
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1)
        
        # Current step information
        self.steps = self.acupressure_guide.get(self.selected_pain, [])
        self.current_step_index = 0
        self.current_step = self.steps[0] if self.steps else None
        self.step_start_time = time.time()
        self.session_active = False
        self.session_complete = False
        self.status_message = "Ready to start acupressure session"
    
    def __del__(self):
        self.cap.release()
        
    def start_session(self):
        """Start or restart the acupressure session"""
        self.current_step_index = 0
        self.current_step = self.steps[0] if self.steps else None
        self.step_start_time = time.time()
        self.session_active = True
        self.session_complete = False
        self.status_message = f"Starting: {self.selected_pain} treatment"
        
    def stop_session(self):
        """Stop the current session"""
        self.session_active = False
        self.status_message = "Session paused"
        
    def next_step(self):
        """Move to the next step"""
        if self.current_step_index < len(self.steps) - 1:
            self.current_step_index += 1
            self.current_step = self.steps[self.current_step_index]
            self.step_start_time = time.time()
            self.status_message = f"Step {self.current_step_index + 1}: {self.current_step['name']}"
        else:
            self.session_active = False
            self.session_complete = True
            self.status_message = "Session complete! You may now rest and hydrate."
    
    def set_pain_type(self, pain_type):
        """Change the pain type treatment"""
        if pain_type in self.acupressure_guide:
            self.selected_pain = pain_type
            self.steps = self.acupressure_guide.get(self.selected_pain, [])
            self.current_step_index = 0
            self.current_step = self.steps[0] if self.steps else None
            self.step_start_time = time.time()
            self.session_active = False
            self.session_complete = False
            self.status_message = f"Selected: {self.selected_pain}"
            
            # Save to file
            try:
                with open("selected_pain.txt", "w") as f:
                    f.write(pain_type)
            except Exception as e:
                print(f"Error saving pain type: {e}")
                
            return True
        return False
    
    def get_available_pain_types(self):
        """Return list of available pain treatments"""
        return list(self.acupressure_guide.keys())
        
    def get_frame(self):
        """Get the current frame with acupressure guidance overlaid"""
        if not self.cap.isOpened():
            return None
            
        success, frame = self.cap.read()
        if not success:
            return None
            
        # Process the frame
        if self.session_active and self.current_step:
            # Process with MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = self.face_mesh.process(rgb_frame)
            
            if result.multi_face_landmarks:
                # Draw landmarks for current step
                for face_landmarks in result.multi_face_landmarks:
                    h, w, _ = frame.shape
                    landmark1 = self.current_step.get("landmark1")
                    landmark2 = self.current_step.get("landmark2")
                    
                    for landmark_id in [landmark1, landmark2]:
                        if landmark_id is not None:
                            landmark = face_landmarks.landmark[landmark_id]
                            x, y = int(landmark.x * w), int(landmark.y * h)
                            cv2.circle(frame, (x, y), 5, (0, 0, 255), -1)
                            cv2.circle(frame, (x, y), 15, (0, 255, 255), 2)
            
            # Check if current step is complete
            elapsed = time.time() - self.step_start_time
            duration = self.current_step.get("duration", 30)
            remaining = max(0, int(duration - elapsed))
            
            # Display step information
            cv2.putText(frame, f"Step {self.current_step_index + 1}/{len(self.steps)}: {self.current_step['name']}", 
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(frame, f"Time remaining: {remaining}s", 
                        (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(frame, f"How: {self.current_step['how']}", 
                        (10, frame.shape[0] - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(frame, f"Precaution: {self.current_step['precaution']}", 
                        (10, frame.shape[0] - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # Automatically move to next step when time is up
            if remaining <= 0:
                self.next_step()
        else:
            # Show status when not in active session
            cv2.putText(frame, self.status_message, 
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            if self.session_complete:
                cv2.putText(frame, "Session complete! Click 'Start Session' to begin again.", 
                            (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            elif self.selected_pain:
                cv2.putText(frame, f"Treatment: {self.selected_pain}", 
                            (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Encode frame to JPEG
        ret, jpeg = cv2.imencode('.jpg', frame)
        return jpeg.tobytes()