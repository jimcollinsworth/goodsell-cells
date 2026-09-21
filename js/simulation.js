import * as THREE from 'three';

export class CellSimulation {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.molecules = [];
    this.bounds = options.bounds || new THREE.Vector3(120, 60, 0);
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
          0
        );

    const entry = {
      mesh: object,
      velocity: vel,
      initialPos: object.position.clone(),
      isStationary: isStationary,
      radius: object.userData.radius || 12
    };

    this.molecules.push(entry);

    // Track rotary machines like ATP Synthase and Flagellar Motor
    if (object.userData.name && (object.userData.name.includes('ATP Synthase') || object.userData.name.includes('Flagellar Motor'))) {
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

    // 1. Semantic machine activity (e.g. 2D rotation for ATP Synthase and Flagellar Motor)
    this.rotors.forEach(rotor => {
      rotor.rotation.z += dt * 0.8;
    });

    // 2. 2D Brownian thermal motion & boundary collisions
    for (let i = 0; i < this.molecules.length; i++) {
      const mol = this.molecules[i];
      if (mol.isStationary) continue;

      // Brownian thermal kick (2D plane: X and Y)
      mol.velocity.x += (Math.random() - 0.5) * this.brownianIntensity * dt;
      mol.velocity.y += (Math.random() - 0.5) * this.brownianIntensity * dt;
      mol.velocity.z = 0; // Lock Z to keep 2D orthographic alignment

      // Damping / viscosity drag
      mol.velocity.multiplyScalar(0.98);

      // Position update
      mol.mesh.position.x += mol.velocity.x * dt * 20;
      mol.mesh.position.y += mol.velocity.y * dt * 20;

      // 2D Boundary reflections (Cell membrane container box)
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
    }

    // 3. 2D Molecular Crowding Sphere/Circle Collisions
    for (let i = 0; i < this.molecules.length; i++) {
      for (let j = i + 1; j < this.molecules.length; j++) {
        const m1 = this.molecules[i];
        const m2 = this.molecules[j];

        const distVec = m1.mesh.position.clone().sub(m2.mesh.position);
        distVec.z = 0; // 2D planar distance calculation
        const dist = distVec.length();
        const minDist = m1.radius + m2.radius;

        if (dist < minDist && dist > 0.001) {
          const overlap = minDist - dist;
          const normal = distVec.normalize();

          if (!m1.isStationary && !m2.isStationary) {
            m1.mesh.position.addScaledVector(normal, overlap * 0.5);
            m2.mesh.position.addScaledVector(normal, -overlap * 0.5);
          } else if (!m1.isStationary && m2.isStationary) {
            m1.mesh.position.addScaledVector(normal, overlap);
          } else if (m1.isStationary && !m2.isStationary) {
            m2.mesh.position.addScaledVector(normal, -overlap);
          }

          // Elastic bounce impulse if moving toward each other
          const relVel = m1.velocity.clone().sub(m2.velocity);
          const velAlongNormal = relVel.dot(normal);

          if (velAlongNormal < 0) {
            if (!m1.isStationary && !m2.isStationary) {
              const impulse = normal.clone().multiplyScalar(velAlongNormal * 0.5);
              m1.velocity.sub(impulse);
              m2.velocity.add(impulse);
            } else if (!m1.isStationary && m2.isStationary) {
              const impulse = normal.clone().multiplyScalar(m1.velocity.dot(normal) * 1.8);
              m1.velocity.sub(impulse);
            } else if (m1.isStationary && !m2.isStationary) {
              const impulse = normal.clone().multiplyScalar(m2.velocity.dot(normal) * 1.8);
              m2.velocity.sub(impulse);
            }
          }
        }
      }
    }
  }
}
