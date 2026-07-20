import * as THREE from "three";
import * as CANNON from "cannon-es";

import { CBall, CCube, CObject } from "./cobjects";
import { CWorldF } from "./cworldf";

export class CBoundKit {
  cball: CBall;
  cracket: CCube;
  interval: NodeJS.Timeout;
  constructor(cworldf: CWorldF, options?: { position: { x: number, z: number } }) {
    const x = options?.position?.x ?? 0;
    const z = options?.position?.z ?? 0;
    this.cball = new CBall({ mass: 1, position: { x: x, y: 10, z: z }, size: 0.1 });
    this.cball.body.material = new CANNON.Material("bouncyMaterial");
    cworldf.addCObject(this.cball);

    const body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(4 / 2, 0.4 / 2, 4 / 2)),
      type: CANNON.Body.DYNAMIC,
      position: new CANNON.Vec3(x, 0.5, z),
      velocity: new CANNON.Vec3(0, 3, 0),
    });
    body.material = new CANNON.Material("bouncyMaterial");
    const geometry = new THREE.BoxGeometry(4, 0.4, 4);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    this.cracket = new CObject(body, mesh);
    cworldf.addCObject(this.cracket);
    this.interval = setInterval(() => {
      body.velocity.y = body.position.y < 0.5 ? 1 : body.position.y > 1 ? -1 : body.velocity.y;
    }, 100);
    const contactMaterial = new CANNON.ContactMaterial(
      this.cball.body.material,
      this.cracket.body.material as CANNON.Material,
      {
        restitution: 0.9,
      }
    );
    cworldf.physics.addContactMaterial(contactMaterial);
  }
}
