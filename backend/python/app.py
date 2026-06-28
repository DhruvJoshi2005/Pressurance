from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from camera import AcupressureCamera
import threading
import pyttsx3
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global camera object
camera = None
speech_engine = None
speech_lock = threading.Lock()

def get_camera():
    global camera
    if camera is None:
        camera = AcupressureCamera()
    return camera

def speak_async(text):
    """Function to speak text in a separate thread"""
    global speech_engine
    
    def speak_thread():
        with speech_lock:
            if speech_engine is None:
                speech_engine = pyttsx3.init()
            print(f"Speaking: {text}")
            speech_engine.say(text)
            speech_engine.runAndWait()
    
    threading.Thread(target=speak_thread, daemon=True).start()

def gen_frames():
    """Video streaming generator function."""
    cam = get_camera()
    while True:
        frame = cam.get_frame()
        if frame is None:
            continue
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/')
def index():
    """Serve a status message."""
    return "Acupressure API is running"

@app.route('/video_feed')
def video_feed():
    """Video streaming route."""
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/start_session', methods=['POST'])
def start_session():
    """Start acupressure session."""
    cam = get_camera()
    cam.start_session()
    
    # Speak first step instructions
    if cam.current_step:
        speak_text = f"Starting step 1: {cam.current_step['name']}. {cam.current_step['how']}. Precaution: {cam.current_step['precaution']}."
        speak_async(speak_text)
    
    return jsonify({"status": "started"})

@app.route('/stop_session', methods=['POST'])
def stop_session():
    """Stop acupressure session."""
    cam = get_camera()
    cam.stop_session()
    speak_async("Session paused.")
    return jsonify({"status": "stopped"})

@app.route('/next_step', methods=['POST'])
def next_step():
    """Skip to next step."""
    cam = get_camera()
    old_index = cam.current_step_index
    cam.next_step()
    
    # Speak if we actually moved to a new step
    if old_index != cam.current_step_index and cam.current_step:
        step_num = cam.current_step_index + 1
        step = cam.current_step
        speak_text = f"Step {step_num}: {step['name']}. {step['how']}. Precaution: {step['precaution']}."
        speak_async(speak_text)
    elif cam.session_complete:
        speak_async("Session complete. You may now rest and hydrate.")
    
    return jsonify({
        "status": "next_step", 
        "completed": cam.session_complete
    })

@app.route('/set_pain_type', methods=['POST'])
def set_pain_type():
    """Change pain type to treat."""
    pain_type = request.json.get('pain_type')
    cam = get_camera()
    success = cam.set_pain_type(pain_type)
    
    if success:
        speak_async(f"Selected treatment for {pain_type}")
        return jsonify({"status": "success", "message": f"Selected: {pain_type}"})
    else:
        return jsonify({"status": "error", "message": "Invalid pain type"})

@app.route('/get_pain_types', methods=['GET'])
def get_pain_types():
    """Get all available pain types."""
    cam = get_camera()
    pain_types = cam.get_available_pain_types()
    current_pain = cam.selected_pain
    return jsonify({
        "pain_types": pain_types,
        "current_pain": current_pain
    })

@app.route('/status', methods=['GET'])
def get_status():
    """Get current session status."""
    cam = get_camera()
    return jsonify({
        "active": cam.session_active,
        "complete": cam.session_complete,
        "current_pain": cam.selected_pain,
        "current_step_index": cam.current_step_index,
        "total_steps": len(cam.steps),
        "status_message": cam.status_message,
        "current_step": cam.current_step if cam.current_step else None
    })

if __name__ == '__main__':
    app.run(host='localhost', port=5000, debug=True, threaded=True)