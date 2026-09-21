import * as THREE from 'three';

export class CellSimulation {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.molecules = [];
    this.bounds = options.bounds || new THREE.Vector3(120, 60, 80);
    this.speed = options.speed || 1.0;
    this.brownianIntensity = options.brownianIntensity || 0.15;
    this.isPaused = false;
    this.rotors = [];
  }

  addMolecule(object, isStationary = false) {
    const vel = isStationary
      ? new THREE.Vector3(0, 0, 0)
      : new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4
        );

    const entry = {
      mesh: object,
      velocity: vel,
      initialPos: object.position.clone(),
      isStationary: isStationary,
      radius: object.userData.radius || 8
    };

    this.molecules.push(entry);

    // Track rotary machines like ATP Synthase
    if (object.userData.name && object.userData.name.includes('ATP Synthase')) {
      this.rotors.push(object);
    }
  }

  clear() {
    this.molecules.forEach(item => {
      this.scene.remove(item.mesh);
    });
    this.molecules = [];
    this.rotors = [];
  }

  setSpeed(speedVal) {
    this.speed = speedVal;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  update(delta) {
    if (this.isPaused) return;

    const dt = delta * this.speed;

    // 1. Semantic machine activity (e.g. ATP Synthase rotation)
    this.rotors.forEach(rotor => {
      rotor.rotation.y += dt * 1.5;
    });

    // 2. Brownian thermal motion & boundary collisions
    for (let i = 0; i < this.molecules.length; i++) {
      const mol = this.molecules[i];
      if (mol.isStationary) continue;

      // Brownian thermal kick
      mol.velocity.x += (Math.random() - 0.5) * this.brownianIntensity * dt;
      mol.velocity.y += (Math.random() - 0.5) * this.brownianIntensity * dt;
      mol.velocity.z += (Math.random() - 0.5) * this.brownianIntensity * dt;

      // Damping / viscosity drag
      mol.velocity.multiplyScalar(0.98);

      // Position update
      mol.mesh.position.addScaledVector(mol.velocity, dt * 20);

      // Boundary reflections (Cell membrane container box)
      const pos = mol.mesh.position;
      const halfB = this.bounds;

      if (Math.abs(pos.x) > halfB.x) {
        pos.x = Math.sign(pos.x) * halfB.x;
        mol.velocity.x *= -0.8;
      }
      if (Math.abs(pos.y) > halfB.y) {
        pos.y = Math.sign(pos.y) * halfB.y;
        mol.velocity.y *= -0.8;
      }
      if (Math.abs(pos.z) > halfB.z) {
        pos.z = Math.sign(pos.z) * halfB.z;
        mol.velocity.z *= -0.8;
      }
    }

    // 3. Molecular Crowding Sphere Collisions
    for (let i = 0; i < this.molecules.length; i++) {
      for (let j = i + 1; j < this.molecules.length; j++) {
        const m1 = this.molecules[i];
        const m2 = this.molecules[j];

        const distVec = m1.mesh.position.clone().sub(m2.mesh.position);
        const dist = distVec.length();
        const minDist = m1.radius + m2.radius;

        if (dist < minDist && dist > 0.001) {
          const overlap = minDist - dist;
          const normal = distVec.normalize();

          if (!m1.isStationary) m1.mesh.position.addScaledVector(normal, overlap * 0.5);
          if (!m2.isStationary) m2.mesh.position.addScaledVector(normal, -overlap * 0.5);

          // Elastic bounce impulse
          const relVel = m1.velocity.clone().sub(m2.velocity);
          const impulse = normal.multiplyScalar(relVel.dot(normal) * 0.5);

          if (!m1.isStationary) m1.velocity.sub(impulse);
          if (!m2.isStationary) m2.velocity.add(impulse);
        }
      }
    }
  }
}
