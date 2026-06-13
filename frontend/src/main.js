import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.2, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.shadowMap.enabled = false;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 2, 2);
directionalLight.castShadow = false;
scene.add(directionalLight);

// Function to create transparent clickable boxes
function createClickableBox(x, y, z, name, onClickUrl) {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(x, y, z),
    new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0})
  );
  box.name = name;
  box.userData.onClickUrl = onClickUrl;
  scene.add(box);
  return box;
}

// Load FBX
const loader = new FBXLoader();
loader.load('./models/humanModel.fbx', (fbx) => {
  fbx.scale.set(0.02, 0.02, 0.02);
  fbx.position.set(0, -2, 0);
  scene.add(fbx);

  // Add clickable boxes
  const trunkBox = createClickableBox(0.6, 1.2, 0.6, 'Trunk', '/trunk.html');
  trunkBox.position.set(0, 0.5, 0);

  const headBox = createClickableBox(0.5, 0.5, 0.5, 'Head', '/head.html');
  headBox.position.set(0, 1.35, 0);

  const left_armBox = createClickableBox(1.4, 0.3, 0.5, 'Arms', '/arms.html');
  left_armBox.position.set(1, 0.9, 0);

  const right_armBox = createClickableBox(1.4, 0.3, 0.5, 'Arms', '/arms.html');
  right_armBox.position.set(-1, 0.9, 0);

  const legsBox = createClickableBox(0.8, 1.9, 0.7, 'Legs', '/legs.html');
  legsBox.position.set(0, -1.1, 0);
});

// Raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const clicked = intersects[0].object;
    console.log('Clicked:', clicked.name);
    if (clicked.userData.onClickUrl) {
      window.location.href = clicked.userData.onClickUrl;
    }
  }
}
window.addEventListener('click', onClick);

// Animate
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
