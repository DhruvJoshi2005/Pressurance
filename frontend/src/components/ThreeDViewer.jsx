import React, { useEffect } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function ThreeDViewer() {
  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.2, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('3d-root').appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 2, 2);
    scene.add(directionalLight);

    const loader = new FBXLoader();
    loader.load('/models/humanModel.fbx', (fbx) => {
      fbx.scale.set(0.02, 0.02, 0.02);
      fbx.position.set(0, -2, 0);
      scene.add(fbx);
    });

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      renderer.dispose();
      document.getElementById('3d-root').innerHTML = '';
    };
  }, []);

  return <div id="3d-root" style={{ width: '100vw', height: '100vh' }} />;
}

export default ThreeDViewer;
