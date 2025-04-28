import * as THREE from "three";
import { CWorldF } from "./cworldf";
import { CCameraController } from "./ccameracontroller";

const cworldf = new CWorldF();
const ccc = new CCameraController(cworldf.camera);


const clock = new THREE.Clock();
function animate() {
  const deltaTime = clock.getDelta();
  ccc.moveCamera(deltaTime);
  cworldf.updateAndRender(deltaTime);
}
cworldf.setAnimationLoop(animate);
