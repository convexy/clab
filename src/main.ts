import * as THREE from "three";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xddeeff);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
camera.position.set(7, 7, 7);
camera.lookAt(0, 7, 0);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(10, 100, -10);
directionalLight.lookAt(0, 0, 0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 200;
scene.add(directionalLight);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
const gridHelper = new THREE.GridHelper(100, 100);
scene.add(gridHelper);

const goundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
const groundMesh = new THREE.Mesh(goundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

class CCameraController {
  camera: THREE.Camera;
  speed: number = 4;
  rotationSpeed: number = 1;
  keys: { w: boolean, a: boolean, s: boolean, d: boolean, j: boolean, k: boolean, h: boolean, l: boolean } = { w: false, a: false, s: false, d: false, j: false, k: false, h: false, l: false };
  constructor(camera: THREE.Camera, speed?: number, rotationSpeed?: number) {
    this.camera = camera;
    if (speed !== undefined) {
      this.speed = speed;
    }
    if (rotationSpeed !== undefined) {
      this.rotationSpeed = rotationSpeed;
    }
    const keys = this.keys;
    window.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "w":
        case "ArrowUp":
          keys.w = true;
          break;
        case "a":
        case "ArrowLeft":
          keys.a = true;
          break;
        case "s":
        case "ArrowDown":
          keys.s = true;
          break;
        case "d":
        case "ArrowRight":
          keys.d = true;
          break;
        case "j":
          keys.j = true;
          break;
        case "k":
          keys.k = true;
          break;
        case "h":
          keys.h = true;
          break;
        case "l":
          keys.l = true;
          break;
      }
    });
    window.addEventListener("keyup", (event) => {
      switch (event.key) {
        case "w":
        case "ArrowUp":
          keys.w = false;
          break;
        case "a":
        case "ArrowLeft":
          keys.a = false;
          break;
        case "s":
        case "ArrowDown":
          keys.s = false;
          break;
        case "d":
        case "ArrowRight":
          keys.d = false;
          break;
        case "j":
          keys.j = false;
          break;
        case "k":
          keys.k = false;
          break;
        case "h":
          keys.h = false;
          break;
        case "l":
          keys.l = false;
          break;
      }
    });
  }
  moveCamera(deltaTime: number) {
    if (this.keys.w) camera.translateZ(- this.speed * deltaTime); // 前進
    if (this.keys.s) camera.translateZ(+ this.speed * deltaTime); // 後退
    if (this.keys.a) camera.translateX(- this.speed * deltaTime); // 左移動
    if (this.keys.d) camera.translateX(+ this.speed * deltaTime); // 右移動
    if (this.keys.j) camera.translateY(- this.speed * deltaTime); // 左移動
    if (this.keys.k) camera.translateY(+ this.speed * deltaTime); // 右移動
    if (this.keys.h) camera.rotateY(+ this.rotationSpeed * deltaTime); // 左回転
    if (this.keys.l) camera.rotateY(- this.rotationSpeed * deltaTime); // 右回転
  }
}

const ccc = new CCameraController(camera);

const clock = new THREE.Clock();
function animate() {
  const deltaTime = clock.getDelta();
  ccc.moveCamera(deltaTime);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
