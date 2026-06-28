import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";

export default function LegsView({ onBack }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // CAMERA: lower body full focus
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

// ⬇️ slightly below pelvis, close enough to zoom
camera.position.set(0, -7.5, 8.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
mount.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 🎯 midpoint between pubic region & toes
controls.target.set(0, -6, 0);
controls.update();


    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const outlinePass = new OutlinePass(
      new THREE.Vector2(width, height),
      scene,
      camera
    );
    outlinePass.visibleEdgeColor.set("#00ffff");
    composer.addPass(outlinePass);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dLight = new THREE.DirectionalLight(0xffffff, 1);
    dLight.position.set(2, 5, 3);
    scene.add(dLight);

    const painZones = [];

    function createPainZoneBox(x, y, z, name, px, py, pz) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(x, y, z),
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
        })
      );
      box.name = name;
      box.position.set(px, py, pz);
      scene.add(box);
      painZones.push(box);
    }

    const loader = new FBXLoader();
    loader.load("/humanModel.fbx", (fbx) => {
      fbx.scale.set(0.1, 0.1, 0.1);
      fbx.position.set(0, -10.5, 0);
      scene.add(fbx);

      // ===== LEGS PAIN ZONES =====
      createPainZoneBox(1.2, 2, 0.4, "Thigh_Left_front", -0.7, -3, 1.0);
      createPainZoneBox(1.2, 2, 0.4, "Thigh_Right_front", 0.7, -3, 1.0);

      createPainZoneBox(1.2, 2.0, 0.8, "Back_Thigh_Left",  -0.7, -3.5, -0.9);
      createPainZoneBox(1.2, 2.0, 0.8, "Back_Thigh_Right",  0.7, -3.5, -0.9);

      createPainZoneBox(1, 1, 1.2, "Glute_Left",  -0.9, -1.9, -1.1);
      createPainZoneBox(1, 1, 1.2, "Glute_Right",  0.9, -1.9, -1.1);

      createPainZoneBox(0.9, 1.4, 0.6, "Knee_Left", -0.7, -5.5, 0.5);
      createPainZoneBox(0.9, 1.4, 0.6, "Knee_Right", 0.7, -5.5, 0.5);

      createPainZoneBox(1, 1.4, 1.4, "Calf_Left", -0.9, -7.1, -0.5);
      createPainZoneBox(1, 1.4, 1.4, "Calf_Right", 0.9, -7.1, -0.5);

      createPainZoneBox(0.6, 0.4, 0.6, "Foot_Heel_Left",  -1.1, -10.4,  -0.7);
      createPainZoneBox(0.6, 0.4, 0.6, "Foot_Heel_Right", 1.1, -10.4,  -0.7);

      createPainZoneBox(0.8, 0.6, 0.9, "Ankle_Left", -1.1, -9.5,  -0.5);       
      createPainZoneBox(0.8, 0.6, 0.9, "Ankle_Right", 1.1, -9.5,  -0.5);

    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let current = null;

    function onClick(event) {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(painZones);

      if (hits.length > 0) {
        current = hits[0].object;
        outlinePass.selectedObjects = [current];

        fetch("http://localhost:8000/humanModel/log-pain", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ area: current.name }),
        });
      }
    }

    mount.addEventListener("click", onClick);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      composer.render();
    };
    animate();

    return () => {
      mount.removeEventListener("click", onClick);
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "600px" }}>
      <button
        onClick={onBack}
        style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}
      >
        ← Back to Full Body
      </button>

      <div ref={mountRef} style={{ width: "100%", height: "600px" }} />
    </div>
  );
}
