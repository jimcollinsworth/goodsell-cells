import * as THREE from 'three';
import { createGoodsellMaterial } from './goodsell-shader.js';
import { getPaletteColor } from './palettes.js';

/**
 * Creates a smooth 2D contoured vector mesh with David Goodsell watercolor fill
 */
export function create2DShapeMesh(shape, colorHex, options = {}) {
  const geometry = new THREE.ShapeGeometry(shape);
  const material = createGoodsellMaterial(colorHex, options);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

/**
 * Helper to generate an organic lobed 2D vector shape (contoured puzzle-piece protein profile)
 */
export function createLobed2DShape(radius, lobesCount = 5, irregularity = 0.25, phaseShift = 0) {
  const shape = new THREE.Shape();
  const numPoints = Math.max(32, lobesCount * 8);
  const angleStep = (Math.PI * 2) / numPoints;

  for (let i = 0; i <= numPoints; i++) {
    const angle = i * angleStep;
    const lobeFactor = 1.0 + Math.sin(angle * lobesCount + phaseShift) * 0.3 * (1.0 + irregularity * Math.cos(angle * 2));
    const r = radius * lobeFactor;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  return shape;
}

/**
 * 70S Ribosome Model (PDB: 4V4A representation)
 * 2D Orthographic contoured assembly: 50S Large Subunit + 30S Small Subunit + mRNA & tRNAs
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

  // 1. Large Subunit (50S) - Violet / Deep Blue watercolor contour (crown shaped)
  const shape50S = new THREE.Shape();
  shape50S.moveTo(-12, -8);
  shape50S.bezierCurveTo(-14, 2, -12, 10, -6, 12); // L1 stalk
  shape50S.bezierCurveTo(-3, 14, 3, 14, 6, 11);   // Central protuberance
  shape50S.bezierCurveTo(12, 9, 14, 2, 10, -8);   // L7/L12 stalk
  shape50S.bezierCurveTo(4, -12, -6, -12, -12, -8);

  const mesh50S = create2DShapeMesh(shape50S, getPaletteColor(paletteName, 'nucleic', 0), options);
  mesh50S.position.set(-2, 0, 0);
  group.add(mesh50S);

  // 50S internal domain lobes for watercolor depth
  const lobe50A = createLobed2DShape(5.5, 4, 0.2);
  const mesh50A = create2DShapeMesh(lobe50A, getPaletteColor(paletteName, 'nucleic', 1), options);
  mesh50A.position.set(-5, 2, 0.1);
  group.add(mesh50A);

  const lobe50B = createLobed2DShape(6.0, 5, 0.2);
  const mesh50B = create2DShapeMesh(lobe50B, getPaletteColor(paletteName, 'nucleic', 2), options);
  mesh50B.position.set(3, -1, 0.1);
  group.add(mesh50B);

  // 2. Small Subunit (30S) - Slate Blue / Cyan puzzle-piece contour
  const shape30S = new THREE.Shape();
  shape30S.moveTo(2, -10);
  shape30S.bezierCurveTo(0, -5, 2, 2, 5, 8);    // Body & Platform
  shape30S.bezierCurveTo(9, 12, 14, 10, 15, 5);  // Head
  shape30S.bezierCurveTo(15, 0, 12, -6, 8, -10); // Base
  shape30S.bezierCurveTo(5, -12, 3, -11, 2, -10);

  const mesh30S = create2DShapeMesh(shape30S, getPaletteColor(paletteName, 'structural', 0), options);
  mesh30S.position.set(4, 0, 0.2);
  group.add(mesh30S);

  const lobe30A = createLobed2DShape(4.0, 3, 0.15);
  const mesh30A = create2DShapeMesh(lobe30A, getPaletteColor(paletteName, 'structural', 1), options);
  mesh30A.position.set(10, 4, 0.3);
  group.add(mesh30A);

  // 3. mRNA strand passing through active cleft
  const mrnaPath = new THREE.CurvePath();
  const mrnaCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-14, -4, 0.4),
    new THREE.Vector3(-4, -6, 0.4),
    new THREE.Vector3(4, -4, 0.4),
    new THREE.Vector3(14, -2, 0.4)
  );
  mrnaPath.add(mrnaCurve);
  const mrnaPoints = mrnaCurve.getPoints(30);
  const mrnaGeo = new THREE.BufferGeometry().setFromPoints(mrnaPoints);
  const mrnaMat = new THREE.LineBasicMaterial({
    color: getPaletteColor(paletteName, 'plasma', 0),
    linewidth: 3
  });
  group.add(new THREE.Line(mrnaGeo, mrnaMat));

  return group;
}

/**
 * ATP Synthase Complex (PDB: 6N2Y representation)
 * 2D Orthographic contoured assembly: F1 Head, Stalk, F0 Membrane Rotor
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

  // 1. F1 Catalytic Headpiece (Hexamer alpha3-beta3 2D contoured assembly)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 14, 0);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const lobeShape = createLobed2DShape(4.2, 4, 0.2, i * 0.5);
    const color = getPaletteColor(paletteName, 'enzyme', i);
    const mesh = create2DShapeMesh(lobeShape, color, options);
    mesh.position.set(Math.cos(angle) * 5.5, Math.sin(angle) * 5.5, 0.1);
    headGroup.add(mesh);
  }
  group.add(headGroup);

  // 2. Central Stalk (gamma subunit)
  const stalkShape = new THREE.Shape();
  stalkShape.moveTo(-1.8, -4);
  stalkShape.lineTo(1.8, -4);
  stalkShape.lineTo(1.2, 12);
  stalkShape.lineTo(-1.2, 12);
  stalkShape.closePath();

  const stalkMesh = create2DShapeMesh(stalkShape, getPaletteColor(paletteName, 'enzyme', 3), options);
  stalkMesh.position.set(0, 0, 0);
  group.add(stalkMesh);

  // 3. Peripheral Stalk (b2 delta stator arm)
  const armShape = new THREE.Shape();
  armShape.moveTo(6, -6);
  armShape.bezierCurveTo(8, 2, 9, 10, 6, 16);
  armShape.lineTo(4.5, 16);
  armShape.bezierCurveTo(7, 10, 6, 2, 4.5, -6);
  armShape.closePath();

  const armMesh = create2DShapeMesh(armShape, getPaletteColor(paletteName, 'enzyme', 4), options);
  armMesh.position.set(2, 0, 0.05);
  group.add(armMesh);

  // 4. F0 Membrane Rotor Ring (c-ring embedded in inner membrane)
  const rotorGroup = new THREE.Group();
  rotorGroup.position.set(0, -6, 0);

  for (let i = 0; i < 8; i++) {
    const x = (i - 3.5) * 2.2;
    const rShape = createLobed2DShape(2.4, 3, 0.1);
    const color = getPaletteColor(paletteName, 'membrane', i % 4);
    const mesh = create2DShapeMesh(rShape, color, options);
    mesh.position.set(x, 0, 0.1);
    rotorGroup.add(mesh);
  }
  group.add(rotorGroup);

  return group;
}

/**
 * B-DNA Double Helix Strand (PDB: 1BNA representation)
 * 2D Orthographic braided double-stranded vector curve with base pair rungs
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

  const amplitude = 4.5;
  const wavelength = 18;

  // Build Strand 1 and Strand 2 continuous contoured ribbons
  for (let y = -length / 2; y <= length / 2; y += 1.8) {
    const angle1 = (y / wavelength) * Math.PI * 2;
    const angle2 = angle1 + Math.PI;

    const x1 = Math.sin(angle1) * amplitude;
    const x2 = Math.sin(angle2) * amplitude;

    // Strand 1 Backbone 2D node
    const s1Shape = createLobed2DShape(1.8, 3, 0.1);
    const c1 = getPaletteColor(paletteName, 'nucleic', Math.floor(y + 100));
    const mesh1 = create2DShapeMesh(s1Shape, c1, options);
    mesh1.position.set(x1, y, 0.1);
    group.add(mesh1);

    // Strand 2 Backbone 2D node
    const s2Shape = createLobed2DShape(1.8, 3, 0.1);
    const c2 = getPaletteColor(paletteName, 'nucleic', Math.floor(y + 200));
    const mesh2 = create2DShapeMesh(s2Shape, c2, options);
    mesh2.position.set(x2, y, 0.1);
    group.add(mesh2);

    // Base Pair Rungs
    if (Math.abs(Math.floor(y)) % 4 === 0) {
      const rungShape = new THREE.Shape();
      rungShape.moveTo(x1, y - 0.5);
      rungShape.lineTo(x2, y - 0.5);
      rungShape.lineTo(x2, y + 0.5);
      rungShape.lineTo(x1, y + 0.5);
      rungShape.closePath();

      const rungColor = getPaletteColor(paletteName, 'nucleic', Math.floor(Math.abs(y)));
      const rungMesh = create2DShapeMesh(rungShape, rungColor, options);
      rungMesh.position.z = 0.05;
      group.add(rungMesh);
    }
  }

  return group;
}

/**
 * Transfer RNA (tRNA, PDB: 1EHZ representation)
 * 2D L-shaped contoured vector profile
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

  // Iconic L-shaped 2D contoured vector shape
  const trnaShape = new THREE.Shape();
  trnaShape.moveTo(-2, -8);   // Anticodon loop
  trnaShape.bezierCurveTo(-4, -4, -3, 2, -2, 6);  // D arm / Acceptor stem
  trnaShape.bezierCurveTo(-1, 8, 2, 8, 4, 6);    // Acceptor 3' end
  trnaShape.bezierCurveTo(2, 4, 2, 1, 6, 0);     // T arm
  trnaShape.bezierCurveTo(8, -1, 7, -3, 4, -3);   // Variable loop
  trnaShape.bezierCurveTo(1, -3, 0, -6, -2, -8); // Return to anticodon

  const trnaMesh = create2DShapeMesh(trnaShape, getPaletteColor(paletteName, 'nucleic', 3), options);
  group.add(trnaMesh);

  // Add 2D loop details
  const anticodonLoop = createLobed2DShape(1.8, 3, 0.1);
  const acMesh = create2DShapeMesh(anticodonLoop, getPaletteColor(paletteName, 'nucleic', 1), options);
  acMesh.position.set(-2, -8, 0.1);
  group.add(acMesh);

  return group;
}

/**
 * Globular Metabolic Enzyme (e.g. Pyruvate Dehydrogenase / Glycolytic Enzyme, PDB: 1PFK)
 * Smooth 2D multi-lobed organic puzzle-piece shape
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

  // Outer contoured 2D puzzle-piece shape
  const mainShape = createLobed2DShape(size, 5, 0.3);
  const mainColor = getPaletteColor(paletteName, category, 0);
  const mainMesh = create2DShapeMesh(mainShape, mainColor, options);
  group.add(mainMesh);

  // Inner subunit 2D lobes forming catalytic domain
  const subCount = 3;
  for (let i = 0; i < subCount; i++) {
    const angle = (i / subCount) * Math.PI * 2;
    const subShape = createLobed2DShape(size * 0.45, 4, 0.2, i * 0.8);
    const color = getPaletteColor(paletteName, category, i + 1);
    const subMesh = create2DShapeMesh(subShape, color, options);
    subMesh.position.set(Math.cos(angle) * (size * 0.35), Math.sin(angle) * (size * 0.35), 0.1);
    group.add(subMesh);
  }

  return group;
}

/**
 * Phospholipid Bilayer Inner Membrane Ribbon
 */
export function createMembraneBilayer(width = 160, depth = 60, paletteName = 'ecoli', options = {}) {
  const group = new THREE.Group();
  group.userData = {
    name: 'Inner Membrane',
    category: 'membrane',
    function: 'Selectively permeable lipid bilayer separating cytoplasm from periplasmic space.'
  };

  const spacing = 4.0;
  const headColor = getPaletteColor(paletteName, 'membrane', 0);
  const tailColor = getPaletteColor(paletteName, 'membrane', 2);

  for (let x = -width / 2; x <= width / 2; x += spacing) {
    const jitterX = (Math.random() - 0.5) * 0.8;
    const waveY = Math.sin(x * 0.05) * 1.5;

    // Outer Layer Head 2D
    const head1 = createLobed2DShape(1.8, 3, 0.1);
    const mHead1 = create2DShapeMesh(head1, headColor, options);
    mHead1.position.set(x + jitterX, waveY + 4, 0.1);
    group.add(mHead1);

    // Inner Layer Head 2D
    const head2 = createLobed2DShape(1.8, 3, 0.1);
    const mHead2 = create2DShapeMesh(head2, headColor, options);
    mHead2.position.set(x + jitterX, waveY - 4, 0.1);
    group.add(mHead2);

    // Lipid tail connecting line
    const tailShape = new THREE.Shape();
    tailShape.moveTo(x + jitterX - 0.4, waveY - 3.5);
    tailShape.lineTo(x + jitterX + 0.4, waveY - 3.5);
    tailShape.lineTo(x + jitterX + 0.4, waveY + 3.5);
    tailShape.lineTo(x + jitterX - 0.4, waveY + 3.5);
    tailShape.closePath();
    const mTail = create2DShapeMesh(tailShape, tailColor, options);
    group.add(mTail);
  }

  return group;
}

/**
 * Outer Membrane Layer (Gram-negative Cell Envelope top boundary)
 */
export function createOuterMembrane(width = 160, paletteName = 'ecoli', options = {}) {
  const group = new THREE.Group();
  group.userData = {
    name: 'Outer Membrane',
    category: 'membrane',
    function: 'Outer lipid bilayer coat containing OMP porin channels protecting periplasmic space.'
  };

  const spacing = 4.0;
  const headColor = getPaletteColor(paletteName, 'membrane', 1);
  const tailColor = getPaletteColor(paletteName, 'membrane', 3);

  for (let x = -width / 2; x <= width / 2; x += spacing) {
    const waveY = Math.sin(x * 0.04) * 1.2;

    // Outer Head
    const head1 = createLobed2DShape(1.8, 3, 0.1);
    const mHead1 = create2DShapeMesh(head1, headColor, options);
    mHead1.position.set(x, waveY + 3.5, 0.1);
    group.add(mHead1);

    // Inner Head
    const head2 = createLobed2DShape(1.8, 3, 0.1);
    const mHead2 = create2DShapeMesh(head2, headColor, options);
    mHead2.position.set(x, waveY - 3.5, 0.1);
    group.add(mHead2);

    // Tail block
    const tailShape = new THREE.Shape();
    tailShape.moveTo(x - 0.4, waveY - 3.0);
    tailShape.lineTo(x + 0.4, waveY - 3.0);
    tailShape.lineTo(x + 0.4, waveY + 3.0);
    tailShape.lineTo(x - 0.4, waveY + 3.0);
    tailShape.closePath();
    const mTail = create2DShapeMesh(tailShape, tailColor, options);
    group.add(mTail);
  }

  // Add embedded OMP Porin Channels (beta-barrel channels)
  for (let px of [-50, 10, 60]) {
    const porinShape = new THREE.Shape();
    porinShape.moveTo(px - 5, -4);
    porinShape.lineTo(px + 5, -4);
    porinShape.lineTo(px + 4, 4);
    porinShape.lineTo(px - 4, 4);
    porinShape.closePath();

    const porinColor = getPaletteColor(paletteName, 'structural', 2);
    const porinMesh = create2DShapeMesh(porinShape, porinColor, options);
    porinMesh.position.z = 0.2;
    group.add(porinMesh);
  }

  return group;
}

/**
 * Peptidoglycan Periplasmic Network Mesh
 */
export function createPeptidoglycanNetwork(width = 160, paletteName = 'ecoli', options = {}) {
  const group = new THREE.Group();
  group.userData = {
    name: 'Peptidoglycan Periplasm',
    category: 'structural',
    function: 'Rigid meshwork layer sustaining cell shape and resisting osmotic turgor pressure.'
  };

  const color = getPaletteColor(paletteName, 'structural', 1);

  // Glycan strands (horizontal 2D wavy lines)
  for (let y of [-6, 0, 6]) {
    const path = new THREE.Shape();
    path.moveTo(-width / 2, y);
    for (let x = -width / 2; x <= width / 2; x += 10) {
      const wy = y + Math.sin(x * 0.1) * 1.0;
      path.lineTo(x, wy);
    }
    path.lineTo(width / 2, y - 0.8);
    path.lineTo(-width / 2, y - 0.8);
    path.closePath();

    const mesh = create2DShapeMesh(path, color, options);
    mesh.position.z = 0.05;
    group.add(mesh);
  }

  return group;
}

/**
 * Authentic Flagellar Motor Complex (PDB: 6YKM representation)
 * Multi-ring 2D rotor assembly spanning inner membrane, periplasm, and outer membrane,
 * connected to the flexible flagellar filament!
 */
export function createFlagellarMotorComplex(paletteName = 'ecoli', options = {}) {
  const group = new THREE.Group();
  group.userData = {
    name: 'Flagellar Motor Complex',
    pdbId: '6YKM',
    category: 'structural',
    weight: '4.2 MDa',
    function: 'Rotary nano-motor spanning cell wall that spins the flagellar filament for bacterial propulsion.'
  };

  // 1. Cytoplasmic C-Ring Rotor (Large cup base in cytoplasm)
  const cRingShape = new THREE.Shape();
  cRingShape.moveTo(-16, -14);
  cRingShape.bezierCurveTo(-18, -8, -12, -4, -8, -4);
  cRingShape.lineTo(8, -4);
  cRingShape.bezierCurveTo(12, -4, 18, -8, 16, -14);
  cRingShape.bezierCurveTo(10, -18, -10, -18, -16, -14);

  const cRingColor = getPaletteColor(paletteName, 'structural', 0);
  const cRingMesh = create2DShapeMesh(cRingShape, cRingColor, options);
  group.add(cRingMesh);

  // 2. MS-Ring & Stator embedded in inner membrane
  const msShape = createLobed2DShape(9, 6, 0.15);
  const msColor = getPaletteColor(paletteName, 'structural', 1);
  const msMesh = create2DShapeMesh(msShape, msColor, options);
  msMesh.position.set(0, -2, 0.1);
  group.add(msMesh);

  // 3. Central Drive Shaft / Rod through periplasm
  const rodShape = new THREE.Shape();
  rodShape.moveTo(-2.5, -2);
  rodShape.lineTo(2.5, -2);
  rodShape.lineTo(2.2, 18);
  rodShape.lineTo(-2.2, 18);
  rodShape.closePath();

  const rodColor = getPaletteColor(paletteName, 'enzyme', 0);
  const rodMesh = create2DShapeMesh(rodShape, rodColor, options);
  rodMesh.position.z = 0.15;
  group.add(rodMesh);

  // 4. P-Ring (Peptidoglycan ring) & L-Ring (Outer membrane ring)
  const pRingShape = createLobed2DShape(6.5, 4, 0.1);
  const pMesh = create2DShapeMesh(pRingShape, getPaletteColor(paletteName, 'structural', 2), options);
  pMesh.position.set(0, 8, 0.2);
  group.add(pMesh);

  const lRingShape = createLobed2DShape(7.5, 5, 0.1);
  const lMesh = create2DShapeMesh(lRingShape, getPaletteColor(paletteName, 'structural', 3), options);
  lMesh.position.set(0, 16, 0.2);
  group.add(lMesh);

  // 5. Flagellar Hook & Helical Filament protruding outward into extracellular space
  const hookShape = new THREE.Shape();
  hookShape.moveTo(-3, 18);
  hookShape.bezierCurveTo(-5, 24, -2, 30, 4, 34);
  hookShape.bezierCurveTo(10, 38, 14, 44, 12, 52);
  hookShape.bezierCurveTo(8, 60, 2, 68, 6, 78);
  hookShape.bezierCurveTo(10, 86, 18, 92, 15, 100);
  hookShape.lineTo(11, 100);
  hookShape.bezierCurveTo(14, 92, 6, 86, 2, 78);
  hookShape.bezierCurveTo(-2, 68, 4, 60, 8, 52);
  hookShape.bezierCurveTo(10, 44, 6, 38, 0, 34);
  hookShape.bezierCurveTo(-6, 30, -9, 24, -6, 18);
  hookShape.closePath();

  const hookColor = getPaletteColor(paletteName, 'plasma', 1);
  const hookMesh = create2DShapeMesh(hookShape, hookColor, options);
  hookMesh.position.z = 0.25;
  group.add(hookMesh);

  return group;
}
