import * as THREE from "three";
import * as CANNON from "cannon";
import Stats from "stats.js";
import * as tf from "@tensorflow/tfjs";

import { CWorldF } from "./cworldf";
import { CCameraController } from "./ccameracontroller";
import { CBall, CCube, CObject } from "./cobjects";
import { Experience, CDeepQLearingAgent } from "./cdqn";
import { CBoundKit } from "./cbound"
import { CCartPole3d } from "./ccartpole3d";
import { RCAction, CVirtualRubiksCube } from "./cvirtualrubikscube";

const cworldf = new CWorldF(10);
const ccc = new CCameraController(cworldf.camera);
ccc.camera.position.set(7, 5, 7);
ccc.camera.lookAt(0, 5, 0);

const cCartPole3d = new CCartPole3d(cworldf);
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) {
    cCartPole3d.generateTrainee({ position: { x: -10 * i, z: -10 * j } });
  }
}

// const cBoundKit = new CBoundKit(cworldf, { position: { x: -10, z: 0 } });


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

// function step() {
//   cworldf.beforeStep.forEach(func => { func() });
//   cworldf.physics.step(1 / 60, 1 / 60, cworldf.accuracy);
//   cworldf.afterStep.forEach(func => { func() });
//   setTimeout(step, 10);
// }
// setTimeout(() => {
//   step();
// }, 3000);




// setTimeout(async () => {
//   const cvrc = new CVirtualRubiksCube();
//   // const model = tf.sequential();
//   // model.add(tf.layers.dense({ inputShape: [cvrc.getRCState().length], units: 48, activation: "relu" }));
//   // model.add(tf.layers.dense({ units: RCAction.values.length, activation: "linear" }));
//   const model = await tf.loadLayersModel('localstorage://cvrc-model');
//   model.compile({ optimizer: tf.train.adam(0.01), loss: "meanSquaredError" });
//   const agent = new CDeepQLearingAgent(model, RCAction.values.length);

//   for (let complexity = 1; complexity <= 2; complexity++) {
//     const num = (RCAction.values.length ** complexity) * 4;
//     let pass = 0;
//     for (let j = 0; j < num; j++) {
//       const actionLimit = complexity * 2;
//       cvrc.setRandomState(complexity);
//       for (let k = 0; k < actionLimit; k++) {
//         const state = cvrc.getRCState();
//         const action = agent.selectAction(state);
//         cvrc.updateState(RCAction.values[action]);
//         const nextState = cvrc.getRCState();
//         const reward = cvrc.point;
//         const done = cvrc.isGoal;
//         agent.remember({ action: action, state: state, nextState: nextState, reward: reward, done: done, });
//         if (done) { pass++; break; }
//       }
//       for (let l = 0; l < complexity * 10; l++) {
//         await agent.replay();
//       }
//       if (j % Math.floor(num / 10) == 0) console.log("*".repeat(Math.floor(j / (num / 10))));
//     }
//     console.log("*".repeat(10));
//     console.log("complexity: " + complexity + ", " + Math.floor(pass / num * 100) + "%");
//     console.log("fitted: " + agent.fit);
//   }
//   model.save('localstorage://cvrc-model').then(_ => console.log("save!"));
//   const complexity = 2;
//   const num = RCAction.values.length * complexity;
//   let pass = 0;
//   for (let j = 0; j < num; j++) {
//     const actionLimit = complexity * 3;
//     cvrc.setRandomState(complexity);
//     for (let k = 0; k < actionLimit; k++) {
//       const state = cvrc.getRCState();
//       const action = agent.selectBestAction(state);
//       cvrc.updateState(RCAction.values[action]);
//       const nextState = cvrc.getRCState();
//       const reward = cvrc.point;
//       const done = cvrc.isGoal;
//       agent.remember({ action: action, state: state, nextState: nextState, reward: reward, done: done, });
//       if (done) { pass++; break; }
//     }
//   }
//   console.log(Math.floor(pass / num * 100) + "%");
// }, 3000);



