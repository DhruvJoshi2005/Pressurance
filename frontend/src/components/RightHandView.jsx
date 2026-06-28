import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";


export default function RightHandView({ onBack }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(3.5, -1, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(6, 3.5, 0);
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
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    const painZones = [];

    function createPainZoneBox(x, y, z, name, px, py, pz) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(x, y, z),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
      );
      box.name = name;
      box.position.set(px, py, pz);
      scene.add(box);
      painZones.push(box);
    }

    const loader = new FBXLoader();
    loader.load("/humanModel.fbx", (fbx) => {
      fbx.scale.set(0.1, 0.1, 0.1);
      fbx.position.set(0, -9.8, 0);
      scene.add(fbx);

      createPainZoneBox(2.2, 1, 1, "Right_UpperArm", 3.2, 4.7, -0.4);
      createPainZoneBox(1.3, 1, 1, "Right_Forearm", 5.2, 4.7, -0.2);
      createPainZoneBox(0.5, 1, 1, "Right_Wrist", 6.3, 4.7, 0.3);
      createPainZoneBox(0.5, 1, 1, "Right_Palm", 7, 4.7, 0.3);
      createPainZoneBox(0.8, 1, 1, "Right_Fingers", 7.8, 4.7, 0.6);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let current = null;

    function onClick(e) {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(painZones);

      if (hits.length) {
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
