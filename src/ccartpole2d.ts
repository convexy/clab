import * as THREE from "three";
import * as CANNON from "cannon-es";
import * as tf from "@tensorflow/tfjs";

import { Experience, CDeepQLearingAgent } from "./cdqn";
import { CCube, CCylinder } from "./cobjects";
import { CWorldF } from "./cworldf";

type Trainee = {
  z: number,
  cstick: CCube,
  ccyl: CCylinder,
  experience: Experience,
  totalReward: number,
  timeSpent: number,
};

export class CCartPole2d {
  cworldf: CWorldF;
  actions: number[] = [-1, 0, 1];
  agent: CDeepQLearingAgent;
  model: tf.LayersModel;
  trainees: Trainee[];
  constructor(cworldf: CWorldF) {
    this.cworldf = cworldf;
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [4], units: 4, activation: "relu" }));
    model.add(tf.layers.dense({ units: 4, activation: "relu" }));
    model.add(tf.layers.dense({ units: 3, activation: "linear" }));
    this.model = model;
    this.model.compile({ optimizer: tf.train.adam(0.01), loss: "meanSquaredError" });

    this.agent = new CDeepQLearingAgent(this.model, this.actions.length);
    this.trainees = [];

    const self = this;
    this.cworldf.beforeStep.push(() => { self.train1() });
    this.cworldf.afterStep.push(() => { self.train2() });
    this.cworldf.afterStep.push(() => { self.rule() });

    async function replay() {
      await self.agent.replay();
      await self.agent.replay();
      await self.agent.replay();
      await self.agent.replay();
      await self.agent.replay();
      console.log(self.agent.fit);
      setTimeout(async () => {
        await replay();
      }, 10);
    }
    setTimeout(() => {
      replay();
    }, 1000);
  }
  generateTrainee(z?: number) {
    const group = 1 << (this.trainees.length + 1);
    const baseZ = z ?? 0;
    const trainee: Trainee = {
      z: baseZ,
      cstick: new CCube({ mass: 0.1, position: { x: 0, y: 0.65 + 1, z: baseZ }, size: { x: 0.1, y: 2, z: 0.1 } }),
      ccyl: new CCylinder({ mass: 1, h: 0.2, r: 0.04 }),
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
    trainee.ccyl.body.position.set(0, 0.7, baseZ);
    trainee.ccyl.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    this.cworldf.addCObject(trainee.cstick);
    this.cworldf.addCObject(trainee.ccyl);
    const constraint = new CANNON.PointToPointConstraint(
      trainee.ccyl.body,
      new CANNON.Vec3(0, 0, 0),
      trainee.cstick.body,
      new CANNON.Vec3(0, -0.95, 0),
    );
    this.cworldf.physics.addConstraint(constraint);
    trainee.cstick.body.linearFactor.set(1, 1, 0);
    trainee.cstick.body.angularFactor.set(0, 0, 1);
    trainee.ccyl.body.linearFactor.set(1, 0, 0);
    trainee.ccyl.body.angularFactor.set(0, 0, 0);

    trainee.cstick.body.collisionFilterGroup = group;
    trainee.cstick.body.collisionFilterMask = 0;
    trainee.ccyl.body.collisionFilterGroup = group;
    trainee.ccyl.body.collisionFilterMask = 0;
    this.trainees.push(trainee);
  }
  train1() {
    this.trainees.forEach(trainee => {
      trainee.experience.state = CCartPole2d.getState(trainee);
      trainee.experience.action = this.agent.selectAction(trainee.experience.state, 0.2);
      trainee.cstick.body.applyForce(new CANNON.Vec3(trainee.experience.action - 1, 0, 0).scale(5), new CANNON.Vec3(0, -0.95, 0));
    });
  }
  train2() {
    this.trainees.forEach(trainee => {
      trainee.experience.nextState = CCartPole2d.getState(trainee);
      if (trainee.cstick.body.position.y > 0.8) {
        trainee.timeSpent++;
        trainee.experience.reward = 0;
        trainee.experience.reward += ((trainee.cstick.body.position.y - 1.3) / (1.65 - 1.3));
        trainee.experience.reward += 1 / (1 + trainee.ccyl.body.position.x ** 2);
        trainee.experience.reward += trainee.timeSpent * 0.01;
        trainee.experience.done = false;
        trainee.totalReward += trainee.experience.reward;
      }
      else {
        trainee.timeSpent = 0;
        trainee.experience.reward = -10;
        trainee.experience.done = true;
        trainee.totalReward += trainee.experience.reward;
        CCartPole2d.setRandomInitState(trainee);
      }
      this.agent.remember(trainee.experience);
    });
  }
  rule() {
  }
  static getState(trainee: Trainee) {
    const euler = new THREE.Euler();
    euler.setFromQuaternion(new THREE.Quaternion(
      trainee.cstick.body.quaternion.x,
      trainee.cstick.body.quaternion.y,
      trainee.cstick.body.quaternion.z,
      trainee.cstick.body.quaternion.w,
    ));
    return [trainee.ccyl.body.position.x, trainee.ccyl.body.velocity.x,
    euler.z, trainee.cstick.body.angularVelocity.z];
  }
  static setRandomInitState(trainee: Trainee) {
    trainee.timeSpent = 0;
    trainee.totalReward = 0;

    trainee.ccyl.body.position.set(0, 0.7, trainee.z);
    trainee.ccyl.body.velocity.set(0, 0, 0);
    trainee.ccyl.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    trainee.ccyl.body.angularVelocity.set(0, 0, 0);
    trainee.ccyl.body.force.set(0, 0, 0);

    // const theta = 0;
    const theta = (Math.random() - 0.5) * Math.PI / 2;
    trainee.cstick.body.position.set(Math.sin(theta), Math.cos(theta) + 0.65, trainee.z);
    trainee.cstick.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), -theta);
    trainee.cstick.body.velocity.set(0, 0, 0);
    trainee.cstick.body.angularVelocity.set(0, 0, 0);
  }
}


