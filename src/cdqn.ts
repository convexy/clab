import * as tf from "@tensorflow/tfjs";

const MaxMemorySize = 1000;

export type Experience = {
  state: number[];
  action: number;
  reward: number;
  nextState: number[];
  done: boolean,
};



export class CDeepQLearingAgent {
  numActions: number;
  gamma: number;
  epsilon: number;
  model: tf.LayersModel;
  memory: Experience[];
  trainingInProgress: boolean;
  fit: number;
  constructor(model: tf.LayersModel, numActions: number, gamma: number = 0.95, epsilon: number = 0.1) {
    this.numActions = numActions;
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.model = model;
    this.memory = [];
    this.fit = 0;
    this.trainingInProgress = false;
  }
  selectAction(state: number[], epsilon: number = this.epsilon) {
    if (Math.random() < epsilon) {
      return Math.floor(Math.random() * this.numActions);
    }
    else {
      return this.selectBestAction(state);
    }
  }
  selectBestAction(state: number[]) {
    const statesTensor = tf.tensor2d([state]);
    const qValuesTensor = this.model.predict(statesTensor) as tf.Tensor;
    const qValues = (qValuesTensor.arraySync() as number[][])[0];
    statesTensor.dispose();
    qValuesTensor.dispose();
    return qValues.indexOf(Math.max(...qValues));
  }
  remember(experience: Experience) {
    this.memory.push(experience);
    if (this.memory.length > MaxMemorySize) this.memory.shift()
  }
  async replay(batchSize: number = 32) {
    if (this.memory.length < batchSize || this.trainingInProgress) return;
    this.trainingInProgress = true;
    try {
      const minibatch = Array.from({ length: batchSize }).map(_ => this.memory[Math.floor(Math.random() * this.memory.length)])
      const statesTensor = tf.tensor2d(minibatch.map(experience => experience.state));
      const nextStatesTensor = tf.tensor2d(minibatch.map(experience => experience.nextState));
      const qStatesValuesTensor = this.model.predict(statesTensor) as tf.Tensor;
      const qStatesValues = await qStatesValuesTensor.array() as number[][];
      const qNextStatesValuesTensor = this.model.predict(nextStatesTensor) as tf.Tensor;
      const qNextStatesValues = await qNextStatesValuesTensor.array() as number[][];
      minibatch.forEach((experience, i) => {
        qStatesValues[i][experience.action] = experience.done ? experience.reward : experience.reward + this.gamma * Math.max(...qNextStatesValues[i]);
      });
      const updatedQStatesValuesTensor = tf.tensor2d(qStatesValues);
      await this.model.fit(statesTensor, updatedQStatesValuesTensor, { epochs: 1, verbose: 0 });
      this.fit++;
      statesTensor.dispose();
      nextStatesTensor.dispose();
      qStatesValuesTensor.dispose();
      qNextStatesValuesTensor.dispose();
      updatedQStatesValuesTensor.dispose();
    }
    catch {
      console.error("error");
    }
    finally {
      this.trainingInProgress = false;
    }
  }
}
