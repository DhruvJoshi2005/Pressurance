import cv2
import mediapipe as mp
import json
import pyttsx3
import time
import speech_recognition as sr
import threading

# Load selected pain
try:
    with open("selected_pain.txt", "r") as f:
        selected_pain = f.read().strip()
except FileNotFoundError:
    print("Error: 'selected_pain.txt' file not found.")
    exit()

# Load guide from JSON
try:
    with open("acupressure_guide.json", "r") as f:
        acupressure_guide = json.load(f)
except FileNotFoundError:
    print("Error: 'acupressure_guide.json' file not found.")
    exit()
except json.JSONDecodeError:
    print("Error: JSON file is not properly formatted.")
    exit()

# Initialize text-to-speech

def speak(text):
    engine = pyttsx3.init()
    print(text)
    engine.say(text)
    engine.runAndWait()

def speak_async(text):
    threading.Thread(target=speak, args=(text,), daemon=True).start()

# Check if selected pain exists
steps = acupressure_guide.get(selected_pain, [])
if not steps:
    speak(f"No steps found for '{selected_pain}'. Please check the spelling or data.")
    exit()

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1)

# Open webcam
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    speak("Camera could not be opened.")
    exit()

# Start processing each step
for i, step in enumerate(steps, start=1):
  
    speak_async(f"Step {i}: {step['name']}. How: {step['how']}. Precaution: {step['precaution']}.")

    duration = step["duration"]
    landmark1 = step.get("landmark1")
    landmark2 = step.get("landmark2")

    start_time = time.time()

    while time.time() - start_time < duration:
        ret, frame = cap.read()
        if not ret:
            speak("Failed to capture frame.")
            break

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = face_mesh.process(rgb_frame)

        if result.multi_face_landmarks:
            for face_landmarks in result.multi_face_landmarks:
                h, w, _ = frame.shape
                for landmark_id in [landmark1, landmark2]:
                    if landmark_id is not None:
                        landmark = face_landmarks.landmark[landmark_id]
                        x, y = int(landmark.x * w), int(landmark.y * h)
                        cv2.circle(frame, (x, y), 5, (0, 0, 255), -1)

                # draw point name
                if landmark1 is not None:
                    cv2.putText(frame, step['name'], (10, 60),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        # Show countdown timer
        remaining = int(duration - (time.time() - start_time))
        cv2.putText(frame, f"{step['name']} - {remaining}s",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        cv2.imshow("Acupressure Guidance", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            speak("Session interrupted by user.")
            cap.release()
            cv2.destroyAllWindows()
            exit()

    speak("Done with this step. Now moving onto the next step")
speak("Session complete. You may now rest and hydrate.")

cap.release()
cv2.destroyAllWindows()