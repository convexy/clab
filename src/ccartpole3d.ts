import * as THREE from "three";
import * as CANNON from "cannon";
import * as tf from "@tensorflow/tfjs";

import { Experience, CDeepQLearingAgent } from "./cdqn";
import { CBall, CCube } from "./cobjects";
import { CWorldF } from "./cworldf";

type Trainee = {
  position: { x: number, z: number },
  csphere: CBall,
  cplate: CCube,
  cstick: CCube,
  experience: Experience,
  totalReward: number,
  timeSpent: number,
};

const loadmodel = await tf.loadLayersModel("indexeddb://ccp-model");
export class CCartPole3d {
  cworldf: CWorldF;
  actions: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  agent: CDeepQLearingAgent;
  model: tf.LayersModel;
  trainees: Trainee[];
  constructor(cworldf: CWorldF) {
    this.cworldf = cworldf;
    // const model = tf.sequential();
    // model.add(tf.layers.dense({ inputShape: [(3 + 3 + 4 + 3) + (3 + 3)], units: 12, activation: "relu" }));
    // model.add(tf.layers.dense({ units: 12, activation: "relu" }));
    // model.add(tf.layers.dense({ units: 9, activation: "linear" }));
    // this.model = model;
    this.model = loadmodel;
    this.model.compile({ optimizer: tf.train.adam(0.01), loss: "meanSquaredError" });

    this.agent = new CDeepQLearingAgent(this.model, this.actions.length);
    this.trainees = [];

    const self = this;
    this.cworldf.beforeStep.push(() => { self.train1() });
    this.cworldf.afterStep.push(() => { self.train2() });
    this.cworldf.afterStep.push(() => { self.rule() });

    function replay() {
      Array.from({ length: 300 }).forEach(async _ => await self.agent.replay());
      setTimeout(() => {
        replay();
      }, 10);
    }
    setTimeout(() => {
      replay();
    }, 1000);

    setInterval(() => {
      self.model.save("indexeddb://ccp-model").then(_ => console.log("save!"));
      console.log(self.agent.fit);
    }, 5000);

  }
  generateTrainee(options?: { position: { x: number, z: number } }) {
    const group = 1 << (this.trainees.length + 1);
    const baseX = options?.position?.x ?? 0;
    const baseZ = options?.position?.z ?? 0;
    const trainee: Trainee = {
      position: { x: baseX, z: baseZ },
      csphere: new CBall({ mass: 1, position: { x: baseX, y: 0.6, z: baseZ }, size: 0.05 }),
      cplate: new CCube({ mass: 1, position: { x: baseX, y: 0.5, z: baseZ }, size: { x: 2, y: 0.1, z: 2 } }),
      cstick: new CCube({ mass: 0.1, position: { x: baseX, y: 0.65 + 1, z: baseZ }, size: { x: 0.1, y: 2, z: 0.1 } }),
      experience: {
        action: 0,
        state: [],
        nextState: [],
        done: false,
        reward: 0,
      },
      totalReward: 0,
      timeSpent: 0,
    }
    this.cworldf.addCObject(trainee.csphere);
    this.cworldf.addCObject(trainee.cplate);
    this.cworldf.addCObject(trainee.cstick);
    const lockConstraint = new CANNON.LockConstraint(trainee.csphere.body, trainee.cplate.body);
    this.cworldf.physics.addConstraint(lockConstraint);
    trainee.cstick.mesh.traverse((obj) => { if (obj instanceof THREE.Mesh) (obj.material as THREE.MeshPhongMaterial).color = new THREE.Color(0x00ff00); });
    const constraint = new CANNON.PointToPointConstraint(
      trainee.csphere.body,
      new CANNON.Vec3(0, 0, 0),
      trainee.cstick.body,
      new CANNON.Vec3(0, -1.05, 0),
    );
    this.cworldf.physics.addConstraint(constraint);
    trainee.csphere.body.collisionFilterGroup = group;
    trainee.csphere.body.collisionFilterMask = group;
    trainee.cplate.body.collisionFilterGroup = group;
    trainee.cplate.body.collisionFilterMask = group;
    trainee.cstick.body.collisionFilterGroup = group;
    trainee.cstick.body.collisionFilterMask = group;

    this.trainees.push(trainee);
  }
  train1() {
    this.trainees.forEach(trainee => {
      trainee.experience.state = CCartPole3d.getState(trainee);
      trainee.experience.action = this.agent.selectAction(trainee.experience.state, 0.2);
      let fx = (trainee.experience.action % 3 - 1) * 20;
      let fz = (Math.floor(trainee.experience.action / 3) - 1) * 20;
      trainee.csphere.body.applyForce(new CANNON.Vec3(fx, 0, fz), new CANNON.Vec3(0, 0, 0));
    });
  }
  train2() {
    this.trainees.forEach(trainee => {
      trainee.experience.nextState = CCartPole3d.getState(trainee);
      if (trainee.cstick.body.position.y > 1) {
        trainee.timeSpent++;
        trainee.experience.reward = 0;
        trainee.experience.reward += ((trainee.cstick.body.position.y - 1.3) / (1.65 - 1.3));
        trainee.experience.reward += (1 / (1 + (trainee.cplate.body.position.x - trainee.position.x) ** 2 + (trainee.cplate.body.position.z - trainee.position.z) ** 2) - 1 / 2);
        // trainee.experience.reward += trainee.timeSpent * 0.01;
        trainee.experience.done = false;
        trainee.totalReward += trainee.experience.reward;
      }
      else {
        trainee.timeSpent = 0;
        trainee.experience.reward = -10;
        trainee.experience.done = true;
        trainee.totalReward += trainee.experience.reward;
        CCartPole3d.setRandomInitState(trainee);
      }
      this.agent.remember(trainee.experience);
    });
  }
  rule() {
    this.trainees.forEach(trainee => {
      trainee.csphere.body.position.y = 0.6;
      trainee.csphere.body.quaternion.set(0, 0, 0, 1);
      trainee.csphere.body.velocity.y = 0;
      trainee.csphere.body.angularVelocity.set(0, 0, 0);

      trainee.cplate.body.position.x = trainee.csphere.body.position.x;
      trainee.cplate.body.position.y = 0.5;
      trainee.cplate.body.position.z = trainee.csphere.body.position.z;
      trainee.cplate.body.quaternion.set(0, 0, 0, 1);
      trainee.cplate.body.velocity.y = 0;
      trainee.cplate.body.angularVelocity.set(0, 0, 0);

    });
  }
  static getState(trainee: Trainee) {
    return [...trainee.cstick.body.position.vsub(new CANNON.Vec3(trainee.position.x, 0, trainee.position.z)).toArray()].concat([...trainee.cstick.body.velocity.toArray()]).concat([...trainee.cstick.body.quaternion.toArray()]).concat([...trainee.cstick.body.angularVelocity.toArray()])
      .concat([...trainee.cplate.body.position.vsub(new CANNON.Vec3(trainee.position.x, 0, trainee.position.z)).toArray()]).concat([...trainee.cplate.body.velocity.toArray()]);
  }
  static setRandomInitState(trainee: Trainee) {
    trainee.timeSpent = 0;
    trainee.totalReward = 0;

    trainee.csphere.body.position.set(0 + trainee.position.x, 0.6, 0 + trainee.position.z);
    trainee.csphere.body.velocity.set(0, 0, 0);
    trainee.csphere.body.quaternion.set(0, 0, 0, 1);
    trainee.csphere.body.angularVelocity.set(0, 0, 0);

    trainee.cplate.body.position.set(0 + trainee.position.x, 0.5, 0 + trainee.position.z);
    trainee.cplate.body.velocity.set(0, 0, 0);
    trainee.cplate.body.quaternion.set(0, 0, 0, 1);
    trainee.cplate.body.angularVelocity.set(0, 0, 0);

    trainee.cstick.body.velocity.set(0, 0, 0);
    trainee.cstick.body.angularVelocity.set(0, 0, 0);
    const rx = Math.random() * 0.4 - 0.2;
    const rz = Math.random() * 0.4 - 0.2;
    const r2 = rx ** 2 + rz ** 2;
    const ry = Math.sqrt(1 - r2);
    const alpha = Math.atan2(rx, rz);
    const beta = Math.atan2(Math.sqrt(r2), ry + 0.05);
    trainee.cstick.body.position.set(rx + trainee.position.x, ry + 0.65, rz + trainee.position.z);
    trainee.cstick.body.quaternion.set(0, 0, 0, 1);
    const q1 = new CANNON.Quaternion();
    q1.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), alpha);
    const q2 = new CANNON.Quaternion();
    q2.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), beta);
    q1.mult(q2, trainee.cstick.body.quaternion);
  }
}


