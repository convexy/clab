import * as CANNON from "cannon";
import * as tf from "@tensorflow/tfjs";

import { Environment, CDeepQLearingAgent, Experience } from "./src/cdqn";


class CVirtualCartPole3d extends Environment {
  position: { x: number, z: number };
  csphere: CANNON.Body;
  cplate: CANNON.Body;
  cstick: CANNON.Body;
  totalReward: number;
  timeSpent: number;
  static numActions: number = 9;
  static count = 0;
  constructor(world: CANNON.World, options?: { position: { x: number, z: number } }) {
    super();
    CVirtualCartPole3d.count++;
    const group = 1 << CVirtualCartPole3d.count;
    const baseX = options?.position?.x ?? 0;
    const baseZ = options?.position?.z ?? 0;
    this.position = { x: baseX, z: baseZ };
    this.csphere = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(0.05),
      position: new CANNON.Vec3(baseX, 0.6, baseZ),
    });
    this.cplate = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(new CANNON.Vec3(1, 0.05, 1)),
      position: new CANNON.Vec3(baseX, 0.5, baseZ),
    });
    this.cstick = new CANNON.Body({
      mass: 0.1,
      shape: new CANNON.Box(new CANNON.Vec3(0.05, 1, 0.05)),
      position: new CANNON.Vec3(baseX, 0.65 + 1, baseZ),
    })
    this.totalReward = 0;
    this.timeSpent = 0;

    world.addBody(this.csphere);
    world.addBody(this.cplate);
    world.addBody(this.cstick);

    const lockConstraint = new CANNON.LockConstraint(this.csphere, this.cplate);
    world.addConstraint(lockConstraint);

    const pointToPointConstraint = new CANNON.PointToPointConstraint(
      this.csphere,
      new CANNON.Vec3(0, 0, 0),
      this.cstick,
      new CANNON.Vec3(0, -1.05, 0),
    )
    world.addConstraint(pointToPointConstraint);
    this.csphere.collisionFilterGroup = group;
    this.csphere.collisionFilterMask = group;
    this.cplate.collisionFilterGroup = group;
    this.cplate.collisionFilterMask = group;
    this.cstick.collisionFilterGroup = group;
    this.cstick.collisionFilterMask = group;
  }
  getState() {
    return [...this.cstick.position.vsub(new CANNON.Vec3(this.position.x, 0, this.position.z)).toArray()].concat([...this.cstick.velocity.toArray()]).concat([...this.cstick.quaternion.toArray()]).concat([...this.cstick.angularVelocity.toArray()])
      .concat([...this.cplate.position.vsub(new CANNON.Vec3(this.position.x, 0, this.position.z)).toArray()]).concat([...this.cplate.velocity.toArray()]);
  }
  receiveAction(action: number) {
    let fx = (action % 3 - 1) * 20;
    let fz = (Math.floor(action / 3) - 1) * 20;
    this.csphere.applyForce(new CANNON.Vec3(fx, 0, fz), new CANNON.Vec3(0, 0, 0));
  }
  calculateReward() {
    let reward = 0;
    reward += ((this.cstick.position.y - 1.3) / (1.65 - 1.3));
    reward += (1 / (1 + (this.cplate.position.x - this.position.x) ** 2 + (this.cplate.position.z - this.position.z) ** 2) - 1 / 2);
    // reward += this.timeSpent * 0.01;
    this.totalReward = reward;
    return reward;
  }
  get isDone() {
    return this.cstick.position.y < 1;
  }
  rule() {
    this.csphere.position.y = 0.6;
    this.csphere.quaternion.set(0, 0, 0, 1);
    this.csphere.velocity.y = 0;
    this.csphere.angularVelocity.set(0, 0, 0);

    this.cplate.position.x = this.csphere.position.x;
    this.cplate.position.y = 0.5;
    this.cplate.position.z = this.csphere.position.z;
    this.cplate.quaternion.set(0, 0, 0, 1);
    this.cplate.velocity.y = 0;
    this.cplate.angularVelocity.set(0, 0, 0);
  }

  setInitState() {
    this.timeSpent = 0;
    this.totalReward = 0;

    this.csphere.position.set(0 + this.position.x, 0.6, 0 + this.position.z);
    this.csphere.velocity.set(0, 0, 0);
    this.csphere.quaternion.set(0, 0, 0, 1);
    this.csphere.angularVelocity.set(0, 0, 0);

    this.cplate.position.set(0 + this.position.x, 0.5, 0 + this.position.z);
    this.cplate.velocity.set(0, 0, 0);
    this.cplate.quaternion.set(0, 0, 0, 1);
    this.cplate.angularVelocity.set(0, 0, 0);

    this.cstick.velocity.set(0, 0, 0);
    this.cstick.angularVelocity.set(0, 0, 0);
    const rx = Math.random() * 0.4 - 0.2;
    const rz = Math.random() * 0.4 - 0.2;
    const r2 = rx ** 2 + rz ** 2;
    const ry = Math.sqrt(1 - r2);
    const alpha = Math.atan2(rx, rz);
    const beta = Math.atan2(Math.sqrt(r2), ry + 0.05);
    this.cstick.position.set(rx + this.position.x, ry + 0.65, rz + this.position.z);
    this.cstick.quaternion.set(0, 0, 0, 1);
    const q1 = new CANNON.Quaternion();
    q1.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), alpha);
    const q2 = new CANNON.Quaternion();
    q2.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), beta);
    q1.mult(q2, this.cstick.quaternion);
  }
}

const world = new CANNON.World();

const model = tf.sequential();
model.add(tf.layers.dense({ inputShape: [(3 + 3 + 4 + 3) + (3 + 3)], units: 12, activation: "relu" }));
model.add(tf.layers.dense({ units: 12, activation: "relu" }));
model.add(tf.layers.dense({ units: 9, activation: "linear" }));

const agent = new CDeepQLearingAgent(model, CVirtualCartPole3d.numActions);

const environments: Environment[] = [];
const experiences: Experience[] = [];
for (let i = 0; i < 1; i++) {
  for (let j = 0; j < 1; j++) {
    environments.push(new CVirtualCartPole3d(world, { position: { x: -10 * i, z: -10 * j } }));
    experiences.push({ action: 0, state: [], nextState: [], reward: 0, done: false });
  }
}


while (true) {
  environments.forEach((environment, index) => {
    experiences[index].state = environment.getState();
    experiences[index].action = agent.selectAction(experiences[index].state);
    environment.receiveAction(experiences[index].action);
  });
  world.step(1 / 60, 1 / 60);
  environments.forEach((environment, index) => {
    experiences[index].nextState = environment.getState();
    experiences[index].reward = environment.calculateReward();
    experiences[index].done = environment.isDone;
    if (experiences[index].done) {
      environment.setInitState();
    }
    agent.remember(experiences[index]);
    (environment as CVirtualCartPole3d).rule();
  });
  agent.replay().then(_ => {
    if (Math.random() < 0.01) {
      console.log("fitted: " + agent.fit);
      model.save("file://models/ccp2-model");
    }
  });
}


