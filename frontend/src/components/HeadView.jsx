// src/components/HeadView.jsx
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";

export default function HeadView({ onBack, onZoneSelected }) {
  const mountRef = useRef(null);
  const [selectedZone, setSelectedZone] = React.useState(null);

  useEffect(() => {
    const mount = mountRef.current;

    // âœ… Default size fallback (prevents zero-size framebuffer)
    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 600;

    // --- Scene setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0.4, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // --- Composer for effects ---
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const outlinePass = new OutlinePass(new THREE.Vector2(width, height), scene, camera);
    outlinePass.edgeStrength = 5;
    outlinePass.edgeGlow = 1;
    outlinePass.edgeThickness = 2;
    outlinePass.pulsePeriod = 0;
    outlinePass.visibleEdgeColor.set("#00ffff");
    outlinePass.hiddenEdgeColor.set("#000000");
    composer.addPass(outlinePass);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 2));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 2, 2);
    scene.add(directionalLight);

    // Expose setSelectedZone to the THREE.js click handler via a ref-like closure
    const setZone = (z) => setSelectedZone(z);

    // Clickable zones
    const painZones = [];
    function createPainZoneBox(x, y, z, name, posX, posY, posZ) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(x, y, z),
        new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0 })
      );
      box.name = name;
      box.position.set(posX, posY, posZ);
      scene.add(box);
      painZones.push(box);
      return box;
    }

    // Load FBX model
    const loader = new FBXLoader();
    loader.load("/humanModel.fbx", (fbx) => {
      fbx.scale.set(0.1, 0.1, 0.1);
      fbx.position.set(0, -16.4, 0);
      scene.add(fbx);

      // Zones
      // posX +0.7 = viewer's right side of model (verify orientation with calibration tool)
      createPainZoneBox(0.2, 0.5, 0.7, "Temple_Right",     0.7,  0.6,  0.1);
      createPainZoneBox(0.2, 0.5, 0.7, "Temple_Left",     -0.7,  0.6,  0.1);
      createPainZoneBox(0.3, 0.4, 0.2, "Mid_Forehead_Pain", 0,   1,    0.9);
      createPainZoneBox(0.3, 0.4, 0.2, "Forehead_Left",    0.4,  1,    0.9);
      createPainZoneBox(0.3, 0.4, 0.2, "Forehead_Right",  -0.4,  1,    0.9);
      createPainZoneBox(0.3, 0.6, 0.45, "Ear_Right",       0.8,  0.24, -0.27);
      createPainZoneBox(0.3, 0.6, 0.45, "Ear_Left",       -0.8,  0.24, -0.27);
      createPainZoneBox(1.3, 0.2, 1.3, "Skull_Pain",       0,    1.4,  0);
      createPainZoneBox(0.8, 1,   0.3, "Back_Neck_Pain",   0,   -0.4, -0.7);
      createPainZoneBox(0.5, 0.7, 0.6, "Jaw_Cheek_Right",  0.5, -0.07, 0.5);
      createPainZoneBox(0.5, 0.7, 0.6, "Jaw_Cheek_Left",  -0.5, -0.07, 0.5);

      createPainZoneBox(0.6, 1.0, 0.8, "Neck_Center", 0, -1, 0);
      createPainZoneBox(0.6, 1.0, 0.6, "Neck_Left", -0.5, -0.9, -0.3);
      createPainZoneBox(0.6, 1.0, 0.6, "Neck_Right", 0.5, -0.9, -0.3);

      createPainZoneBox(1.2, 1.3, 1.2, "Shoulder_Left", -1.6, -1.8, -0.5);
      createPainZoneBox(1.2, 1.3, 1.2, "Shoulder_Right", 1.6, -1.8, -0.5);
    });

    // Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentlyGlowing = null;

    function onClick(event) {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(painZones, true);
      if (intersects.length > 0) {
        const clicked = intersects[0].object;
        const region = clicked.name;

        if (currentlyGlowing === clicked) {
          outlinePass.selectedObjects = [];
          currentlyGlowing = null;
          setZone(null);
        } else {
          outlinePass.selectedObjects = [clicked];
          currentlyGlowing = clicked;
          setZone(region);

          const token = localStorage.getItem("token");
          fetch("http://localhost:8000/humanModel/log-pain", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ area: region }),
          })
            .then((res) => res.json())
            .catch((err) => console.error("Error:", err));
        }
      }
    }

    mount.addEventListener("click", onClick);

    // Animate
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      composer.render();
    };
    animate();

    // âœ… Resize fix
    const handleResize = () => {
      const newWidth = mount.clientWidth || 600;
      const newHeight = mount.clientHeight || 600;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      composer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => {
      mount.removeChild(renderer.domElement);
      mount.removeEventListener("click", onClick);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const zoneLabelMap = {
    Temple_Left: "Left Temple", Temple_Right: "Right Temple",
    Mid_Forehead_Pain: "Mid Forehead",
    Forehead_Left: "Left Forehead", Forehead_Right: "Right Forehead",
    Ear_Left: "Left Ear", Ear_Right: "Right Ear",
    Skull_Pain: "Top of Skull",
    Back_Neck_Pain: "Back of Neck",
    Jaw_Cheek_Left: "Left Jaw / Cheek", Jaw_Cheek_Right: "Right Jaw / Cheek",
    Neck_Center: "Center Neck", Neck_Left: "Left Neck", Neck_Right: "Right Neck",
    Shoulder_Left: "Left Shoulder", Shoulder_Right: "Right Shoulder",
  };

  return (
    <div style={{ position: 'relative', width: "100%", height: "600px" }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: 'absolute', top: '20px', left: '20px', zIndex: 1000,
            padding: '10px 20px', fontSize: '15px', background: '#6b7280',
            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)', fontWeight: '500',
          }}
        >
          ← Back to Full Body
        </button>
      )}

      {!selectedZone && (
        <div style={{
          position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: 'rgba(0,0,0,0.6)', color: 'white',
          padding: '10px 20px', borderRadius: '8px', fontSize: '14px', pointerEvents: 'none',
        }}>
          Click on a pain zone to select it
        </div>
      )}

      {selectedZone && (
        <div style={{
          position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.7)', color: 'white',
            padding: '10px 16px', borderRadius: '8px', fontSize: '14px',
          }}>
            Selected: <strong>{zoneLabelMap[selectedZone] || selectedZone}</strong>
          </div>
          {onZoneSelected && (
            <button
              onClick={() => onZoneSelected(selectedZone)}
              style={{
                padding: '10px 22px', fontSize: '15px', background: '#3b82f6',
                color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontWeight: '600', boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
              }}
            >
              Continue to Assessment →
            </button>
          )}
        </div>
      )}

      <div
        ref={mountRef}
        style={{ width: "100%", height: "600px", border: "1px solid #ccc" }}
      />
    </div>
  );
}