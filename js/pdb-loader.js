import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { createGoodsellMaterial } from './goodsell-shader.js';
import { getPaletteColor } from './palettes.js';

// Base Sphere Geometry reused across molecular assemblies for high performance
const sphereGeometry = new THREE.SphereGeometry(1, 14, 14);

/**
 * Creates a single space-filling sphere element
 */
export function createAtomSphere(x, y, z, radius, colorHex, options = {}) {
  const material = createGoodsellMaterial(colorHex, options);
  const mesh = new THREE.Mesh(sphereGeometry, material);
  mesh.position.set(x, y, z);
  mesh.scale.setScalar(radius);
  return mesh;
}

/**
 * 70S Ribosome Model (PDB: 4V4A representation)
 * Large Subunit (50S) + Small Subunit (30S) + rRNA strands
 */
export function createRibosomeComplex(paletteName = 'ecoli', options = {}) {
  const group = new THREE.Group();
  group.userData = {
    name: '70S Ribosome',
    pdbId: '4V4A',
    category: 'nucleic',
    weight: '2.5 MDa',
    function: 'Translates mRNA genetic instructions into functional polypeptide chains.'
  };

  const numSpheres = 180;
  // Large Subunit (50S) - Violet / Deep Blue
  for (let i = 0; i < numSpheres * 0.65; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = (12 + Math.random() * 8) * Math.cbrt(Math.random());

    const x = r * Math.sin(phi) * Math.cos(theta) - 4;
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    const radius = 2.2 + Math.random() * 1.5;
    const color = getPaletteColor(paletteName, 'nucleic', i);
    group.add(createAtomSphere(x, y, z, radius, color, options));
  }

  // Small Subunit (30S) - Greenish Blue / Cyan
  for (let i = 0; i < numSpheres * 0.35; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = (8 + Math.random() * 5) * Math.cbrt(Math.random());

    const x = r * Math.sin(phi) * Math.cos(theta) + 12;
    const y = r * Math.sin(phi) * Math.sin(theta) + 2;
    const z = r * Math.cos(phi);

    const radius = 2.0 + Math.random() * 1.2;
    const color = getPaletteColor(paletteName, 'structural', i);
    group.add(createAtomSphere(x, y, z, radius, color, options));
  }

  return group;
}

/**
 * ATP Synthase Complex (PDB: 6N2Y representation)
 * F0 membrane rotor + F1 catalytic head piece stalk
 */
export function createATPSynthaseComplex(paletteName = 'ecoli', options = {}) {
  const group = new THREE.Group();
  group.userData = {
    name: 'ATP Synthase Machine',
    pdbId: '6N2Y',
    category: 'enzyme',
    weight: '550 kDa',
    function: 'Rotary nano-motor synthesizing ATP from proton electrochemical gradient.'
  };

  // F1 Headpiece (Catalytic Hexamer alpha3-beta3)
  const headRadius = 11;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const hx = Math.cos(angle) * 7;
    const hz = Math.sin(angle) * 7;
    const hy = 16;

    for (let k = 0; k < 12; k++) {
      const rx = hx + (Math.random() - 0.5) * 6;
      const ry = hy + (Math.random() - 0.5) * 8;
      const rz = hz + (Math.random() - 0.5) * 6;
      const color = getPaletteColor(paletteName, 'enzyme', i + k);
      group.add(createAtomSphere(rx, ry, rz, 2.3, color, options));
    }
  }

  // Central Stalk (gamma subunit)
  for (let y = 0; y <= 16; y += 2.5) {
    const color = getPaletteColor(paletteName, 'enzyme', Math.floor(y));
    group.add(createAtomSphere((Math.random() - 0.5) * 2, y, (Math.random() - 0.5) * 2, 2.5, color, options));
  }

  // F0 Membrane Rotor Ring
  const rotorRadius = 8;
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const rx = Math.cos(angle) * rotorRadius;
    const rz = Math.sin(angle) * rotorRadius;
    const ry = -4;

    for (let k = 0; k < 4; k++) {
      const color = getPaletteColor(paletteName, 'membrane', i + k);
      group.add(createAtomSphere(rx, ry + k * 2, rz, 2.2, color, options));
    }
  }

  return group;
}

/**
 * B-DNA Double Helix Strand
 */
export function createDNAStrand(length = 80, paletteName = 'ecoli', options = {}) {
  const group = new THREE.Group();
  group.userData = {
    name: 'B-DNA Double Helix',
    pdbId: '1BNA',
    category: 'nucleic',
    weight: '2.0 kDa / bp',
    function: 'Genetic repository storing organism hereditary code.'
  };

  const helixRadius = 5.5;
  const pitch = 14;

  for (let y = -length / 2; y <= length / 2; y += 1.8) {
    const angle1 = (y / pitch) * Math.PI * 2;
    const angle2 = angle1 + Math.PI;

    // Strand 1 Backbone
    const x1 = Math.cos(angle1) * helixRadius;
    const z1 = Math.sin(angle1) * helixRadius;
    const c1 = getPaletteColor(paletteName, 'nucleic', Math.floor(y + 100));
    group.add(createAtomSphere(x1, y, z1, 2.0, c1, options));

    // Strand 2 Backbone
    const x2 = Math.cos(angle2) * helixRadius;
    const z2 = Math.sin(angle2) * helixRadius;
    const c2 = getPaletteColor(paletteName, 'nucleic', Math.floor(y + 200));
    group.add(createAtomSphere(x2, y, z2, 2.0, c2, options));

    // Base Pair Rungs
    if (Math.floor(y) % 3 === 0) {
      const steps = 4;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const bx = x1 * (1 - t) + x2 * t;
        const bz = z1 * (1 - t) + z2 * t;
        const bc = getPaletteColor(paletteName, 'nucleic', s);
        group.add(createAtomSphere(bx, y, bz, 1.4, bc, options));
      }
    }
  }

  return group;
}

/**
 * Transfer RNA (tRNA, PDB: 1EHZ representation)
 */
export function createtRNA(paletteName = 'ecoli', options = {}) {
  const group = new THREE.Group();
  group.userData = {
    name: 'Transfer RNA (tRNA)',
    pdbId: '1EHZ',
    category: 'nucleic',
    weight: '25 kDa',
    function: 'Adaptor molecule matching amino acids to mRNA codon sequences.'
  };

  // L-shaped tertiary structure
  // Acceptor stem (vertical arm)
  for (let y = 0; y < 14; y += 1.8) {
    const color = getPaletteColor(paletteName, 'nucleic', y);
    group.add(createAtomSphere((Math.random() - 0.5) * 2, y, (Math.random() - 0.5) * 2, 2.0, color, options));
  }
  // Anticodon arm (horizontal arm)
  for (let x = 0; x < 12; x += 1.8) {
    const color = getPaletteColor(paletteName, 'nucleic', x + 10);
    group.add(createAtomSphere(x, 0, (Math.random() - 0.5) * 2, 2.0, color, options));
  }

  return group;
}

/**
 * Globular Metabolic Enzyme (e.g., Pyruvate Dehydrogenase / Glycolytic Enzyme)
 */
export function createEnzymeBlob(size = 8, paletteName = 'ecoli', category = 'enzyme', options = {}) {
  const group = new THREE.Group();
  group.userData = {
    name: 'Metabolic Enzyme Complex',
    pdbId: '1PFK',
    category: category,
    weight: '140 kDa',
    function: 'Catalyzes essential metabolic reactions in the cytoplasm.'
  };

  const count = Math.floor(size * 4);
  for (let i = 0; i < count; i++) {
    const rx = (Math.random() - 0.5) * size;
    const ry = (Math.random() - 0.5) * size;
    const rz = (Math.random() - 0.5) * size;
    const radius = 2.0 + Math.random() * 1.2;
    const color = getPaletteColor(paletteName, category, i);
    group.add(createAtomSphere(rx, ry, rz, radius, color, options));
  }

  return group;
}

/**
 * Phospholipid Bilayer Membrane Slice
 */
export function createMembraneBilayer(width = 120, depth = 60, paletteName = 'ecoli', options = {}) {
  const group = new THREE.Group();
  group.userData = {
    name: 'Phospholipid Bilayer Membrane',
    category: 'membrane',
    function: 'Selectively permeable lipid barrier separating cellular interior from exterior.'
  };

  const spacing = 4.2;
  const headColor = getPaletteColor(paletteName, 'membrane', 0);
  const tailColor = getPaletteColor(paletteName, 'membrane', 2);

  for (let x = -width / 2; x <= width / 2; x += spacing) {
    for (let z = -depth / 2; z <= depth / 2; z += spacing) {
      const jitterX = (Math.random() - 0.5) * 1.2;
      const jitterZ = (Math.random() - 0.5) * 1.2;

      // Outer Layer Head
      group.add(createAtomSphere(x + jitterX, 6, z + jitterZ, 2.1, headColor, options));
      // Outer Layer Tail
      group.add(createAtomSphere(x + jitterX, 2, z + jitterZ, 1.5, tailColor, options));

      // Inner Layer Tail
      group.add(createAtomSphere(x + jitterX, -2, z + jitterZ, 1.5, tailColor, options));
      // Inner Layer Head
      group.add(createAtomSphere(x + jitterX, -6, z + jitterZ, 2.1, headColor, options));
    }
  }

  return group;
}
