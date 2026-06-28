import React, { useEffect, useRef } from "react";
import api from "../utils/api";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";

export default function TrunkView({ onBack }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 600;

    // ---------------- Scene ----------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // ---------------- Camera (TRUNK FOCUSED) ----------------
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, -1.2, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // ---------------- Controls ----------------
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 🔥 IMPORTANT: LOOK AT TRUNK (NOT HEAD)
    controls.target.set(0, 2, 0);
    controls.update();

    controls.minDistance = 1.5;
    controls.maxDistance = 8;

    // ---------------- Composer ----------------
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const outlinePass = new OutlinePass(
      new THREE.Vector2(width, height),
      scene,
      camera
    );
    outlinePass.edgeStrength = 4;
    outlinePass.edgeGlow = 0.5;
    outlinePass.edgeThickness = 2;
    outlinePass.visibleEdgeColor.set("#00ffff");
    composer.addPass(outlinePass);

    // ---------------- Lights ----------------
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(2, 3, 3);
    scene.add(directionalLight);

    // ---------------- Pain Zones ----------------
    const painZones = [];

    function createPainZoneBox(x, y, z, name, px, py, pz) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(x, y, z),
        new THREE.MeshBasicMaterial({
          color: 0xff0000,
          transparent: true,
          opacity: 0, // set 0.3 for debugging
        })
      );
      box.name = name;
      box.position.set(px, py, pz);
      scene.add(box);
      painZones.push(box);
    }

    // ---------------- Load Model ----------------
    const loader = new FBXLoader();
    loader.load("/humanModel.fbx", (fbx) => {
      fbx.scale.set(0.1, 0.1, 0.1);
      fbx.position.set(0, -10.5, 0);
      scene.add(fbx);

      // ========= FRONT =========
      createPainZoneBox(0.8, 0.6, 0.5, "Chest_Left",  -0.8, 2.8,  1.1);
      createPainZoneBox(0.8, 0.6, 0.5, "Chest_Right",  0.8, 2.8,  1.1);
      createPainZoneBox(0.9, 0.6, 0.5, "Chest_Center", 0.0, 2.8,  1);

      createPainZoneBox(1.9, 0.6, 0.5, "Upper_Abdomen", 0.0, 1.7,  1.1);
      createPainZoneBox(1.9, 0.6, 0.5, "Lower_Abdomen", 0.0, 1,  1.1);

      // ========= BACK =========
      createPainZoneBox(2, 0.7, 0.5, "Upper_Back", 0.0, 3.8, -1.2);
      createPainZoneBox(2, 0.7, 0.5, "Mid_Back",   0.0, 2.5, -0.9);
      createPainZoneBox(1.5, 0.7, 0.5, "Lower_Back", 0.0, 1, -0.9);

      // ========= SIDES =========
      createPainZoneBox(0.6, 1.2, 1.3, "Flank_Left",  -1.1, 1.3, 0.0);
      createPainZoneBox(0.6, 1.2, 1.3, "Flank_Right",  1.1, 1.3, 0.0);
    });

    // ---------------- Raycasting ----------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let current = null;

    function onClick(event) {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(painZones, true);

      if (hits.length > 0) {
        const clicked = hits[0].object;

        if (current === clicked) {
          outlinePass.selectedObjects = [];
          current = null;
        } else {
          outlinePass.selectedObjects = [clicked];
          current = clicked;

          api.post("/humanModel/log-pain", { area: clicked.name }).catch(console.error);
        }
      }
    }

    mount.addEventListener("click", onClick);

    // ---------------- Animate ----------------
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      composer.render();
    };
    animate();

    // ---------------- Resize ----------------
    function handleResize() {
      const w = mount.clientWidth || 600;
      const h = mount.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    // ---------------- Cleanup ----------------
    return () => {
      mount.removeEventListener("click", onClick);
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "600px" }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 1000,
            padding: "12px 24px",
            background: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          ← Back to Full Body
        </button>
      )}

      <div
        ref={mountRef}
        style={{ width: "100%", height: "600px", border: "1px solid #ccc" }}
      />
    </div>
  );
}
