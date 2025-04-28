import * as THREE from "three";

export class CCameraController {
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
    if (this.keys.w) this.camera.translateZ(- this.speed * deltaTime); // 前進
    if (this.keys.s) this.camera.translateZ(+ this.speed * deltaTime); // 後退
    if (this.keys.a) this.camera.translateX(- this.speed * deltaTime); // 左移動
    if (this.keys.d) this.camera.translateX(+ this.speed * deltaTime); // 右移動
    if (this.keys.j) this.camera.translateY(- this.speed * deltaTime); // 左移動
    if (this.keys.k) this.camera.translateY(+ this.speed * deltaTime); // 右移動
    if (this.keys.h) this.camera.rotateY(+ this.rotationSpeed * deltaTime); // 左回転
    if (this.keys.l) this.camera.rotateY(- this.rotationSpeed * deltaTime); // 右回転
  }
}