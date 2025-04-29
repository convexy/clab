import * as THREE from "three";
import * as CANNON from "cannon";
import Stats from "stats.js";
import * as tf from "@tensorflow/tfjs";

import { CWorldF } from "./cworldf";
import { CCameraController } from "./ccameracontroller";
import { CBall, CCube, CObject } from "./cobjects";
import { Experience, CDeepQLearingAgent } from "./cdqn";

const cworldf = new CWorldF(10);
const ccc = new CCameraController(cworldf.camera);
ccc.camera.position.set(7, 5, 7);
ccc.camera.lookAt(0, 5, 0);

async function getModel() {
  // const model = tf.sequential();
  // model.add(tf.layers.dense({ inputShape: [(3 + 3 + 4 + 3) + (3 + 3)], units: 6, activation: "relu" }));
  // model.add(tf.layers.dense({ units: 6, activation: "relu" }));
  // model.add(tf.layers.dense({ units: 25, activation: "softmax" }));
  const model = await tf.loadLayersModel('indexeddb://clab-model');
  return model;
}
const model = await getModel();
model.compile({ optimizer: tf.train.adam(0.01), loss: "meanSquaredError" });

const cdqnAgent = new CDeepQLearingAgent(model, 25);

let dx = -10;
let dz = -10;

function setRandomInitState(cobject: CObject, dx: number, dy: number, dz: number) {
  // const rx = Math.random() * 0.4 - 0.2;
  // const rz = Math.random() * 0.4 - 0.2;
  const rx = - 0.2;
  const rz = - 0.2;
  const r2 = rx ** 2 + rz ** 2;
  const ry = Math.sqrt(1 - r2);
  const alpha = Math.atan2(rx, rz);
  const beta = Math.atan2(Math.sqrt(r2), ry + 0.05);

  cobject.body.position.set(rx + dx, ry + dy, rz + dz);
  cobject.body.quaternion.set(0, 0, 0, 1);
  const q1 = new CANNON.Quaternion();
  q1.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), alpha);
  const q2 = new CANNON.Quaternion();
  q2.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), beta);
  q1.mult(q2, cobject.body.quaternion);
}


function generateTrainee(i: number, j: number) {
  const group = (1 << i) + (1 << (16 + j));
  const csphere = new CBall({ mass: 1, position: { x: 0 + dx * i, y: 0.6, z: 0 + dz * j }, size: 0.05 });
  const cplate = new CCube({ mass: 1, position: { x: 0 + dx * i, y: 0.5, z: 0 + dz * j }, size: { x: 2, y: 0.1, z: 2 } });
  const cstick = new CCube({ mass: 0.1, position: { x: 0 + dx * i, y: 0.65 + 1, z: 0 + dz * j }, size: { x: 0.1, y: 2, z: 0.1 } });
  cworldf.addCObject(csphere);
  cworldf.addCObject(cplate);
  cworldf.addCObject(cstick);
  const lockConstraint = new CANNON.LockConstraint(csphere.body, cplate.body);
  cworldf.physics.addConstraint(lockConstraint);

  cstick.mesh.traverse((obj) => { if (obj instanceof THREE.Mesh) (obj.material as THREE.MeshPhongMaterial).color = new THREE.Color(0x00ff00); });
  csphere.body.type = CANNON.Body.DYNAMIC;
  cplate.body.type = CANNON.Body.DYNAMIC;
  const constraint = new CANNON.PointToPointConstraint(
    csphere.body,
    new CANNON.Vec3(0, 0, 0),
    cstick.body,
    new CANNON.Vec3(0, -1.05, 0),
  );
  cworldf.physics.addConstraint(constraint);

  csphere.body.collisionFilterGroup = group;
  csphere.body.collisionFilterMask = group;
  cplate.body.collisionFilterGroup = group;
  cplate.body.collisionFilterMask = group;
  cstick.body.collisionFilterGroup = group;
  cstick.body.collisionFilterMask = group;

  function getState() {
    return [...cstick.body.position.vsub(new CANNON.Vec3(dx * i, 0, dz * j)).toArray()].concat([...cstick.body.velocity.toArray()]).concat([...cstick.body.quaternion.toArray()]).concat([...cstick.body.angularVelocity.toArray()])
      .concat([...cplate.body.position.vsub(new CANNON.Vec3(dx * i, 0, dz * j)).toArray()]).concat([...cplate.body.velocity.toArray()]);
  }

  setRandomInitState(cstick, dx * i, 0.65, dz * j);
  let action = 0;
  let state = getState();
  let totalReward = 0;
  let timeSpent = 0;
  async function train1() {
    action = cdqnAgent.selectAction(state);
    let fx = (action % 5 - 2) * 5;
    let fz = (Math.floor(action / 5) - 2) * 5;
    csphere.body.applyForce(new CANNON.Vec3(fx, 0, fz), new CANNON.Vec3(0, 0, 0));
  }
  async function train2() {
    let nextState = getState();
    // console.log(cstick.body.position.y, cplate.body.velocity);
    if (cstick.body.position.y > 1.2) {
      timeSpent++;
      // let reward = ((cstick.body.position.y - 1) / 0.65);
      let reward = ((cstick.body.position.y - 1.6) / 0.05) + timeSpent * 0.01;
      // let reward = ((cstick.body.position.y - 1) / 0.65) + (1 / (1 + (cplate.body.position.x - dx * i) ** 2 + (cplate.body.position.z - dz * j) ** 2) - 1 / 2) + timeSpent * 0.01;
      totalReward += reward;
      cdqnAgent.remember({ state: state, nextState: nextState, action: action, done: false, reward: reward });
      state = nextState;
    }
    else {
      if (Math.random() < 0.001) {
        await model.save("indexeddb://clab-model");
        console.log("save!");
      }
      let reward = -10;
      totalReward += reward;
      cdqnAgent.remember({ state: state, nextState: nextState, action: action, done: true, reward: reward });
      timeSpent = 0;
      if (Math.random() < 0.001) console.log("total reward:" + Math.floor(totalReward));
      totalReward = 0;
      setRandomInitState(cstick, dx * i, 0.65, dz * j);
      cstick.body.velocity.set(0, 0, 0);
      cstick.body.angularVelocity.set(0, 0, 0);

      cplate.body.position.set(0 + dx * i, 0.5, 0 + dz * j);
      cplate.body.velocity.set(0, 0, 0);
      cplate.body.quaternion.set(0, 0, 0, 1);
      cplate.body.angularVelocity.set(0, 0, 0);
      csphere.body.position.set(0 + dx * i, 0.6, 0 + dz * j);
      csphere.body.velocity.set(0, 0, 0);
      csphere.body.quaternion.set(0, 0, 0, 1);
      csphere.body.angularVelocity.set(0, 0, 0);
      state = getState();
    }
  }

  async function replay() {
    await cdqnAgent.replay();
  }

  function rule() {
    csphere.body.position.y = 0.6;
    csphere.body.quaternion.set(0, 0, 0, 1);
    csphere.body.velocity.y = 0;
    csphere.body.angularVelocity.set(0, 0, 0);
    cplate.body.position.x = csphere.body.position.x;
    cplate.body.position.y = 0.5;
    cplate.body.position.z = csphere.body.position.z;
    cplate.body.quaternion.set(0, 0, 0, 1);
    cplate.body.velocity.y = 0;
    cplate.body.angularVelocity.set(0, 0, 0);
  }
  cworldf.beforeStep.push(train1);
  cworldf.afterStep.push(train2);
  cworldf.afterStep.push(rule);
  cworldf.afterStep.push(replay);

}

for (let i = 0; i < 2; i++) {
  for (let j = 0; j < 2; j++) {
    generateTrainee(i, j);
  }
}


(function () {
  const cball = new CBall({ mass: 1, position: { x: -10, y: 10, z: 0 }, size: 0.1 });
  cball.body.material = new CANNON.Material("bouncyMaterial");
  cworldf.addCObject(cball);

  const body = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(4 / 2, 0.4 / 2, 4 / 2)),
    type: CANNON.Body.DYNAMIC,
    position: new CANNON.Vec3(-10, 0.5, 0),
    velocity: new CANNON.Vec3(0, 3, 0),
  });
  body.material = new CANNON.Material("bouncyMaterial");
  const geometry = new THREE.BoxGeometry(4, 0.4, 4);
  const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
  const mesh = new THREE.Mesh(geometry, material);
  const cobject = new CObject(body, mesh);
  cworldf.addCObject(cobject);
  const interval = setInterval(() => {
    body.velocity.y = body.position.y < 0.5 ? 1 : body.position.y > 1 ? -1 : body.velocity.y;
  }, 100);

  const contactMaterial = new CANNON.ContactMaterial(
    cball.body.material,
    cobject.body.material,
    {
      restitution: 0.9,
    }
  );

  cworldf.physics.addContactMaterial(contactMaterial);
});

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

