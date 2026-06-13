import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function HumanViewer({ onPartClick }) {
  const viewerRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  const [sceneData, setSceneData] = useState({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    clickableParts: [],
  });

  const [zooming, setZooming] = useState(false);

  // ===============================
  // INIT SCENE (RUNS ONCE)
  // ===============================
  useEffect(() => {
    const container = viewerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, -2, 0);
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(5, 10, 7);
    scene.add(light);

    setSceneData({
      scene,
      camera,
      renderer,
      controls,
      clickableParts: [],
    });

    let mounted = true;

    const animate = () => {
      if (!mounted) return;
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mounted) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      mounted = false;
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ===============================
  // LOAD MODEL + CLICKABLE BOXES
  // ===============================
  useEffect(() => {
    if (!sceneData.scene) return;

    const loader = new FBXLoader();
    loader.load("/humanModel.fbx", (model) => {
      model.scale.set(0.08, 0.08, 0.08);
      model.position.set(0, -9.8, 0);
      sceneData.scene.add(model);

      // HEAD
      const headBox = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 2.8, 2),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
      );
      headBox.position.set(0, 3.2, -0.1);
      headBox.name = "Head";
      sceneData.scene.add(headBox);

      // TRUNK
      const trunkBox = new THREE.Mesh(
        new THREE.BoxGeometry(3, 4, 3),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
      );
      trunkBox.position.set(0, -0.5, 0);
      trunkBox.name = "Trunk";
      sceneData.scene.add(trunkBox);

      // LEGS
      const legsBox = new THREE.Mesh(
        new THREE.BoxGeometry(3, 9, 3),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
      );
      legsBox.position.set(0, -6.5, 0);
      legsBox.name = "Legs";
      sceneData.scene.add(legsBox);

      // LEFT HAND (ADDED)
      const leftHandBox = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 1, 1.2),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
      );
      leftHandBox.position.set(-4.2, 1.8, -0.1);
      leftHandBox.name = "LeftHand";
      sceneData.scene.add(leftHandBox);

      // RIGHT HAND (ADDED)
      const rightHandBox = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 1, 1.2),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
      );
      rightHandBox.position.set(4.2, 1.8, -0.1);
      rightHandBox.name = "RightHand";
      sceneData.scene.add(rightHandBox);

      setSceneData((prev) => ({
        ...prev,
        clickableParts: [
          headBox,
          trunkBox,
          legsBox,
          leftHandBox,
          rightHandBox,
        ],
      }));
    });
  }, [sceneData.scene]);

  // ===============================
  // ZOOM
  // ===============================
  const zoomTo = useCallback((pos, lookAt) => {
    const { camera, controls } = sceneData;
    if (!camera || !controls) return;

    setZooming(true);
    controls.enabled = false;

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();

    const startTime = performance.now();
    const duration = 2000;

    const animateZoom = (time) => {
      const t = Math.min((time - startTime) / duration, 1);
      const ease =
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      camera.position.lerpVectors(
        startPos,
        new THREE.Vector3(pos.x, pos.y, pos.z),
        ease
      );

      controls.target.lerpVectors(
        startTarget,
        new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z),
        ease
      );

      camera.lookAt(controls.target);

      if (t < 1) {
        requestAnimationFrame(animateZoom);
      } else {
        controls.enabled = true;
        controls.update();
        setZooming(false);
      }
    };

    requestAnimationFrame(animateZoom);
  }, [sceneData]);

  // ===============================
  // CLICK HANDLER
  // ===============================
  useEffect(() => {
    const container = viewerRef.current;
    if (!container || !sceneData.camera) return;

    const handleClick = (event) => {
      if (zooming) return;
      event.stopPropagation();

      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, sceneData.camera);
      const hits = raycasterRef.current.intersectObjects(sceneData.clickableParts);

      if (!hits.length) return;

      const clickedPart = hits[0].object.name;
      console.log("✅ HUMANVIEWER CLICK:", clickedPart);

      if (onPartClick) onPartClick(clickedPart);

      const zoomTargets = {
        Head: {
          pos: { x: 0, y: 0.6, z: 2.6 },
          lookAt: { x: 0, y: 0.6, z: 0 },
        },
        Trunk: {
          pos: { x: 0, y: -1.8, z: 4.2 },
          lookAt: { x: 0, y: -2.2, z: 0 },
        },
        Legs: {
          pos: { x: 0, y: -6.5, z: 4.5 },
          lookAt: { x: 0, y: -7, z: 0 },
        },
        LeftHand: {
          pos: { x: -4, y: -1.5, z: 4 },
          lookAt: { x: -3, y: -1.5, z: 0 },
        },
        RightHand: {
          pos: { x: 4, y: -1.5, z: 4 },
          lookAt: { x: 3, y: -1.5, z: 0 },
        },
      };

      const target = zoomTargets[clickedPart];
      if (target) zoomTo(target.pos, target.lookAt);
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [sceneData, zooming, onPartClick, zoomTo]);

  return (
    <div
      ref={viewerRef}
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        inset: 0,
        cursor: zooming ? "wait" : "pointer",
      }}
    />
  );
}
