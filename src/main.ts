import * as THREE from "three";
import * as CANNON from "cannon";
import Stats from 'stats.js';

import { CWorldF } from "./cworldf";
import { CCameraController } from "./ccameracontroller";
import { CBall, CObject } from "./cobjects";

const cworldf = new CWorldF(10000);
const ccc = new CCameraController(cworldf.camera);
ccc.camera.position.set(7, 5, 7);
ccc.camera.lookAt(0, 5, 0);

const cball = new CBall({ mass: 1, position: { x: 0, y: 10, z: 0 }, size: 0.1 });
cball.body.material = new CANNON.Material("bouncyMaterial");
cworldf.addCObject(cball);

const body = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Box(new CANNON.Vec3(4 / 2, 0.4 / 2, 4 / 2)),
  type: CANNON.Body.DYNAMIC,
  position: new CANNON.Vec3(0, 0.5, 0),
  velocity: new CANNON.Vec3(0, 5, 0),
});
body.material = new CANNON.Material("bouncyMaterial");
const geometry = new THREE.BoxGeometry(4, 0.4, 4);
const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const mesh = new THREE.Mesh(geometry, material);
const cobject = new CObject(body, mesh);
cworldf.addCObject(cobject);
const interval = setInterval(() => {
  body.velocity.y = body.position.y < 0.5 ? 5 : body.position.y > 1 ? -5 : body.velocity.y;
}, 100);

const contactMaterial = new CANNON.ContactMaterial(
  cball.body.material,
  cobject.body.material,
  {
    restitution: 0.9,
  }
);

cworldf.physics.addContactMaterial(contactMaterial);

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
const clock = new THREE.Clock();
function animate() {
  stats.begin();
  const deltaTime = clock.getDelta();
  ccc.moveCamera(deltaTime);
  cworldf.updateAndRender(deltaTime);
  stats.end();
}
cworldf.setAnimationLoop(animate);
