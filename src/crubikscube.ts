import { RCAction, RCState, CVirtualRubiksCube } from "./cvirtualrubikscube";
import * as THREE from "three";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

export class CRubiksCube extends CVirtualRubiksCube {
  model: THREE.Object3D | undefined;
  initArrangement: { [key: string]: THREE.Object3D<THREE.Object3DEventMap>; };
  arrangement: { [key: string]: THREE.Object3D<THREE.Object3DEventMap>; };
  constructor() {
    super();
    this.initArrangement = {};
    this.arrangement = {};
    const self = this;
    loader.load("/models/Rubik's Cube.glb", (gltf) => {
      self.model = gltf.scene;
      self.model.position.y = 3;
      gltf.scene.traverse((child) => {
        if (child.name.substring(0, 6) == "piece-") {
          self.initArrangement[child.name.substring(6)] = child;
          self.arrangement[child.name.substring(6)] = child;
        }
      });
    });
  }
  updateState(action: RCAction) {
    super.updateState(action);
    let axis = new THREE.Vector3(1, 0, 0);
    let point = new THREE.Vector3(0, 0, 0);
    let face = "white";
    switch (action) {
      case RCAction.Wr:
      case RCAction.Yl:
        axis.set(-1, 0, 0);
        break;
      case RCAction.Wl:
      case RCAction.Yr:
        axis.set(1, 0, 0);
        break;
      case RCAction.Br:
      case RCAction.Gl:
        axis.set(0, -1, 0);
        break;
      case RCAction.Bl:
      case RCAction.Gr:
        axis.set(0, 1, 0);
        break;
      case RCAction.Rr:
      case RCAction.Ol:
        axis.set(0, 0, 1);
        break;
      case RCAction.Rl:
      case RCAction.Or:
        axis.set(0, 0, -1);
        break;
    }
    switch (action) {
      case RCAction.Wr:
      case RCAction.Wl:
        point.set(1, 0, 0);
        face = "white";
        break;
      case RCAction.Yr:
      case RCAction.Yl:
        point.set(-1, 0, 0);
        face = "yellow";
        break;
      case RCAction.Br:
      case RCAction.Bl:
        point.set(0, 1, 0);
        face = "blue";
        break;
      case RCAction.Gr:
      case RCAction.Gl:
        point.set(0, -1, 0);
        face = "green";
        break;
      case RCAction.Rr:
      case RCAction.Rl:
        point.set(0, 0, -1);
        face = "red";
        break;
      case RCAction.Or:
      case RCAction.Ol:
        point.set(0, 0, 1);
        face = "orange";
        break;
    }
    const piecePermutation = CRubiksCube.convertRCActionToPiecePermutation(action);
    for (const [key, piece] of Object.entries(this.arrangement).filter(([key, value]) => key.includes(face))) {
      this.arrangement[piecePermutation[key]] = piece;
      CRubiksCube.rotatePiece(piece, axis, point, Math.PI / 2)
    }
  }
  updateStateWithAnimation(action: RCAction, milliseconds: number = 500, fps: number = 60) {
    super.updateState(action);
    let axis = new THREE.Vector3(1, 0, 0);
    let point = new THREE.Vector3(0, 0, 0);
    let face = "white";
    switch (action) {
      case RCAction.Wr:
      case RCAction.Yl:
        axis.set(-1, 0, 0);
        break;
      case RCAction.Wl:
      case RCAction.Yr:
        axis.set(1, 0, 0);
        break;
      case RCAction.Br:
      case RCAction.Gl:
        axis.set(0, -1, 0);
        break;
      case RCAction.Bl:
      case RCAction.Gr:
        axis.set(0, 1, 0);
        break;
      case RCAction.Rr:
      case RCAction.Ol:
        axis.set(0, 0, 1);
        break;
      case RCAction.Rl:
      case RCAction.Or:
        axis.set(0, 0, -1);
        break;
    }
    switch (action) {
      case RCAction.Wr:
      case RCAction.Wl:
        point.set(1, 0, 0);
        face = "white";
        break;
      case RCAction.Yr:
      case RCAction.Yl:
        point.set(-1, 0, 0);
        face = "yellow";
        break;
      case RCAction.Br:
      case RCAction.Bl:
        point.set(0, 1, 0);
        face = "blue";
        break;
      case RCAction.Gr:
      case RCAction.Gl:
        point.set(0, -1, 0);
        face = "green";
        break;
      case RCAction.Rr:
      case RCAction.Rl:
        point.set(0, 0, -1);
        face = "red";
        break;
      case RCAction.Or:
      case RCAction.Ol:
        point.set(0, 0, 1);
        face = "orange";
        break;
    }
    const targets = Object.fromEntries(Object.entries(this.arrangement).filter(([key, value]) => key.includes(face)));
    const permutation = CRubiksCube.convertRCActionToPiecePermutation(action);
    for (const key in targets) this.arrangement[permutation[key]] = targets[key];
    const steps = Math.floor(milliseconds * fps / 1000);
    const stepSecond = 1 / fps;
    let angle = 0;
    const deltaAngle = Math.PI / 2 / steps;
    const interval = setInterval(() => {
      if (angle < Math.PI / 2) {
        for (const piece of Object.values(targets)) {
          CRubiksCube.rotatePiece(piece, axis, point, Math.min(deltaAngle, Math.PI / 2 - angle));
        }
        angle += deltaAngle;
      } else {
        clearInterval(interval);
      }
    }, stepSecond);
  }
  static convertRCActionToPiecePermutation(action: RCAction) {
    let permutation: { [key: string]: string } = {
      "white": "white",
      "blue": "blue",
      "red": "red",
      "green": "green",
      "orange": "orange",
      "yellow": "yellow",
      "white-blue": "white-blue",
      "white-red": "white-red",
      "white-green": "white-green",
      "white-orange": "white-orange",
      "yellow-blue": "yellow-blue",
      "yellow-red": "yellow-red",
      "yellow-green": "yellow-green",
      "yellow-orange": "yellow-orange",
      "white-blue-red": "white-blue-red",
      "white-red-green": "white-red-green",
      "white-green-orange": "white-green-orange",
      "white-orange-blue": "white-orange-blue",
      "yellow-red-blue": "yellow-red-blue",
      "yellow-green-red": "yellow-green-red",
      "yellow-orange-green": "yellow-orange-green",
      "yellow-blue-orange": "yellow-blue-orange",
    };
    switch (action) {
      case RCAction.Wr:
        permutation["white-orange-blue"] = "white-blue-red";
        permutation["white-blue-red"] = "white-red-green";
        permutation["white-red-green"] = "white-green-orange";
        permutation["white-green-orange"] = "white-orange-blue";
        permutation["white-blue"] = "white-red";
        permutation["white-red"] = "white-green";
        permutation["white-green"] = "white-orange";
        permutation["white-orange"] = "white-blue";
        break;
      case RCAction.Wl:
        permutation["white-orange-blue"] = "white-green-orange";
        permutation["white-blue-red"] = "white-orange-blue";
        permutation["white-red-green"] = "white-blue-red";
        permutation["white-green-orange"] = "white-red-green";
        permutation["white-blue"] = "white-orange";
        permutation["white-red"] = "white-blue";
        permutation["white-green"] = "white-red";
        permutation["white-orange"] = "white-green";
        break;
      case RCAction.Yr:
        permutation["yellow-blue-orange"] = "yellow-orange-green";
        permutation["yellow-orange-green"] = "yellow-green-red";
        permutation["yellow-green-red"] = "yellow-red-blue";
        permutation["yellow-red-blue"] = "yellow-blue-orange";
        permutation["yellow-blue"] = "yellow-orange";
        permutation["yellow-red"] = "yellow-blue";
        permutation["yellow-green"] = "yellow-red";
        permutation["yellow-orange"] = "yellow-green";
        break;
      case RCAction.Yl:
        permutation["yellow-blue-orange"] = "yellow-red-blue";
        permutation["yellow-orange-green"] = "yellow-blue-orange";
        permutation["yellow-green-red"] = "yellow-orange-green";
        permutation["yellow-red-blue"] = "yellow-green-red";
        permutation["yellow-blue"] = "yellow-red";
        permutation["yellow-red"] = "yellow-green";
        permutation["yellow-green"] = "yellow-orange";
        permutation["yellow-orange"] = "yellow-blue";
        break;
      case RCAction.Br:
        permutation["white-orange-blue"] = "yellow-blue-orange";
        permutation["yellow-blue-orange"] = "yellow-red-blue";
        permutation["yellow-red-blue"] = "white-blue-red";
        permutation["white-blue-red"] = "white-orange-blue";
        permutation["white-blue"] = "orange-blue";
        permutation["orange-blue"] = "yellow-blue";
        permutation["yellow-blue"] = "blue-red";
        permutation["blue-red"] = "white-blue";
        break;
      case RCAction.Bl:
        permutation["white-orange-blue"] = "white-blue-red";
        permutation["yellow-blue-orange"] = "white-orange-blue";
        permutation["yellow-red-blue"] = "yellow-blue-orange";
        permutation["white-blue-red"] = "yellow-red-blue";
        permutation["white-blue"] = "blue-red";
        permutation["orange-blue"] = "white-blue";
        permutation["yellow-blue"] = "orange-blue";
        permutation["blue-red"] = "yellow-blue";
        break;
      case RCAction.Rr:
        permutation["white-blue-red"] = "yellow-red-blue";
        permutation["yellow-red-blue"] = "yellow-green-red";
        permutation["yellow-green-red"] = "white-red-green";
        permutation["white-red-green"] = "white-blue-red";
        permutation["white-red"] = "blue-red";
        permutation["blue-red"] = "yellow-red";
        permutation["yellow-red"] = "red-green";
        permutation["red-green"] = "white-red";
        break;
      case RCAction.Rl:
        permutation["white-blue-red"] = "white-red-green";
        permutation["yellow-red-blue"] = "white-blue-red";
        permutation["yellow-green-red"] = "yellow-red-blue";
        permutation["white-red-green"] = "yellow-green-red";
        permutation["white-red"] = "red-green";
        permutation["blue-red"] = "white-red";
        permutation["yellow-red"] = "blue-red";
        permutation["red-green"] = "yellow-red";
        break;
      case RCAction.Gr:
        permutation["white-red-green"] = "yellow-green-red";
        permutation["yellow-green-red"] = "yellow-orange-green";
        permutation["yellow-orange-green"] = "white-green-orange";
        permutation["white-green-orange"] = "white-red-green";
        permutation["white-green"] = "red-green";
        permutation["red-green"] = "yellow-green";
        permutation["yellow-green"] = "green-orange";
        permutation["green-orange"] = "white-green";
        break;
      case RCAction.Gl:
        permutation["white-red-green"] = "white-green-orange";
        permutation["yellow-green-red"] = "white-red-green";
        permutation["yellow-orange-green"] = "yellow-green-red";
        permutation["white-green-orange"] = "yellow-orange-green";
        permutation["white-green"] = "green-orange";
        permutation["red-green"] = "white-green";
        permutation["yellow-green"] = "red-green";
        permutation["green-orange"] = "yellow-green";
        break;
      case RCAction.Or:
        permutation["white-green-orange"] = "yellow-orange-green";
        permutation["yellow-orange-green"] = "yellow-blue-orange";
        permutation["yellow-blue-orange"] = "white-orange-blue";
        permutation["white-orange-blue"] = "white-green-orange";
        permutation["white-orange"] = "green-orange";
        permutation["green-orange"] = "yellow-orange";
        permutation["yellow-orange"] = "orange-blue";
        permutation["orange-blue"] = "white-orange";
        break;
      case RCAction.Ol:
        permutation["white-green-orange"] = "white-orange-blue";
        permutation["yellow-orange-green"] = "white-green-orange";
        permutation["yellow-blue-orange"] = "yellow-orange-green";
        permutation["white-orange-blue"] = "yellow-blue-orange";
        permutation["white-orange"] = "orange-blue";
        permutation["green-orange"] = "white-orange";
        permutation["yellow-orange"] = "green-orange";
        permutation["orange-blue"] = "yellow-orange";
        break;
    }
    return permutation;
  }
  private static rotatePiece(piece: THREE.Object3D, axis: THREE.Vector3, point: THREE.Vector3, angle: number) {
    piece.position.sub(point);
    piece.position.applyAxisAngle(axis, angle);
    piece.position.add(point);
    piece.rotateOnWorldAxis(axis, angle);
  }
  reset() {
    super.reset();
    this.arrangement = { ...this.initArrangement };
  }
}
