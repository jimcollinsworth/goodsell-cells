import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import { GOODSELL_PALETTES } from './palettes.js';
import { SobelOutlineShader } from './goodsell-shader.js';
import {
  createRibosomeComplex,
  createATPSynthaseComplex,
  createDNAStrand,
  createtRNA,
  createEnzymeBlob,
  createMembraneBilayer,
  createOuterMembrane,
  createPeptidoglycanNetwork,
  createFlagellarMotorComplex
} from './pdb-loader.js';
import { CellSimulation } from './simulation.js';
import { SimulatorUI } from './ui.js';

class GoodsellCellSimulator {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.currentPalette = 'ecoli';
    this.currentScenePreset = 'crowded-ecoli';
    this.toneSteps = 3;
    this.outlineThickness = 1.5;

    this.initThree();
    this.initPostProcessing();
    this.simulation = new CellSimulation(this.scene);
    this.ui = new SimulatorUI(this);

    this.initRaycaster();
    this.loadScenePreset(this.currentScenePreset);
    this.animate();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(GOODSELL_PALETTES.ecoli.bg);

    // Pure 2D Orthographic Camera (no 3D perspective distortion)
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 160;
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 140);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // 2D Controls (Panning & Orthographic Zoom, No Rotation)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false; // Pure 2D orthographic slice navigation
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;
    this.controls.minZoom = 0.4;
    this.controls.maxZoom = 4.0;

    // Ambient Lighting for Flat 2D Cel-Shading
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight.position.set(20, 40, 100);
    this.scene.add(dirLight);
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const pixelRatio = this.renderer.getPixelRatio();
    this.outlinePass = new ShaderPass(SobelOutlineShader);
    this.outlinePass.uniforms['resolution'].value.set(
      window.innerWidth * pixelRatio,
      window.innerHeight * pixelRatio
    );
    this.outlinePass.uniforms['outlineThickness'].value = this.outlineThickness;
    this.outlinePass.uniforms['inkColor'].value.set(GOODSELL_PALETTES.ecoli.inkColor);
    this.composer.addPass(this.outlinePass);
  }

  initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    window.addEventListener('pointermove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);

      if (intersects.length > 0) {
        let topGroup = intersects[0].object;
        while (topGroup.parent && topGroup.parent !== this.scene && !topGroup.userData.name) {
          topGroup = topGroup.parent;
        }

        if (topGroup.userData && topGroup.userData.name) {
          this.ui.showTooltip(e.clientX, e.clientY, topGroup.userData);
          return;
        }
      }
      this.ui.hideTooltip();
    });
  }

  setPalette(paletteKey) {
    this.currentPalette = paletteKey;
    const palette = GOODSELL_PALETTES[paletteKey] || GOODSELL_PALETTES.ecoli;
    this.scene.background.set(palette.bg);
    this.outlinePass.uniforms['inkColor'].value.set(palette.inkColor);
    this.loadScenePreset(this.currentScenePreset);
  }

  setOutlineThickness(thickness) {
    this.outlineThickness = thickness;
    this.outlinePass.uniforms['outlineThickness'].value = thickness;
  }

  setToneSteps(steps) {
    this.toneSteps = steps;
    this.scene.traverse((child) => {
      if (child.material && child.material.uniforms && child.material.uniforms.uToneSteps) {
        child.material.uniforms.uToneSteps.value = steps;
      }
    });
  }

  resetCamera() {
    this.camera.position.set(0, 0, 140);
    this.camera.zoom = 1.0;
    this.camera.updateProjectionMatrix();
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  loadScenePreset(presetName) {
    this.currentScenePreset = presetName;
    this.simulation.clear();

    const options = {
      toneSteps: this.toneSteps,
      paletteName: this.currentPalette
    };

    if (presetName === 'crowded-ecoli') {
      // Authentic Cell Envelope Architecture (Cross-Sectional Anatomical Slice)

      // 1. Outer Membrane Layer (top boundary)
      const outerMembrane = createOuterMembrane(220, this.currentPalette, options);
      outerMembrane.position.y = 65;
      this.scene.add(outerMembrane);
      this.simulation.addMolecule(outerMembrane, true);

      // 2. Periplasmic Peptidoglycan Network Space
      const peptidoglycan = createPeptidoglycanNetwork(220, this.currentPalette, options);
      peptidoglycan.position.y = 52;
      this.scene.add(peptidoglycan);
      this.simulation.addMolecule(peptidoglycan, true);

      // 3. Inner Plasma Membrane Bilayer
      const innerMembrane = createMembraneBilayer(220, 60, this.currentPalette, options);
      innerMembrane.position.y = 40;
      this.scene.add(innerMembrane);
      this.simulation.addMolecule(innerMembrane, true);

      // 4. Authentic Flagellar Motor Complex (spanning inner membrane, periplasm, outer membrane & filament)
      const flagellarMotor = createFlagellarMotorComplex(this.currentPalette, options);
      flagellarMotor.position.set(-45, 40, 0);
      flagellarMotor.userData.radius = 18;
      this.scene.add(flagellarMotor);
      this.simulation.addMolecule(flagellarMotor, true);

      // 5. ATP Synthase Embedded in Inner Membrane
      const atp = createATPSynthaseComplex(this.currentPalette, options);
      atp.position.set(45, 40, 0);
      atp.userData.radius = 14;
      this.scene.add(atp);
      this.simulation.addMolecule(atp, true);

      // 6. Central 2D 70S Ribosomes in Cytoplasm
      const ribo1 = createRibosomeComplex(this.currentPalette, options);
      ribo1.position.set(-25, 5, 0);
      ribo1.userData.radius = 16;
      this.scene.add(ribo1);
      this.simulation.addMolecule(ribo1);

      const ribo2 = createRibosomeComplex(this.currentPalette, options);
      ribo2.position.set(25, -10, 0);
      ribo2.userData.radius = 16;
      this.scene.add(ribo2);
      this.simulation.addMolecule(ribo2);

      // 7. DNA Double Helix Fibers
      const dna = createDNAStrand(100, this.currentPalette, options);
      dna.position.set(0, -25, 0);
      dna.rotation.z = Math.PI / 12;
      dna.userData.radius = 12;
      this.scene.add(dna);
      this.simulation.addMolecule(dna, true);

      // 8. Crowded Cytoplasmic Enzymes & tRNAs
      for (let i = 0; i < 16; i++) {
        const categories = ['enzyme', 'structural', 'plasma'];
        const cat = categories[i % categories.length];
        const enzyme = createEnzymeBlob(8 + Math.random() * 4, this.currentPalette, cat, options);
        enzyme.position.set(
          (Math.random() - 0.5) * 100,
          -10 + (Math.random() - 0.5) * 45,
          0
        );
        enzyme.userData.radius = 7;
        this.scene.add(enzyme);
        this.simulation.addMolecule(enzyme);
      }

      for (let i = 0; i < 6; i++) {
        const trna = createtRNA(this.currentPalette, options);
        trna.position.set(
          (Math.random() - 0.5) * 90,
          -5 + (Math.random() - 0.5) * 35,
          0
        );
        trna.userData.radius = 5;
        this.scene.add(trna);
        this.simulation.addMolecule(trna);
      }
    } else if (presetName === 'focal-ribosome') {
      const ribo = createRibosomeComplex(this.currentPalette, options);
      ribo.position.set(0, 0, 0);
      ribo.scale.setScalar(1.4);
      ribo.userData.radius = 20;
      this.scene.add(ribo);
      this.simulation.addMolecule(ribo, true);

      // Surround with floating tRNAs in 2D plane
      for (let i = 0; i < 8; i++) {
        const trna = createtRNA(this.currentPalette, options);
        trna.position.set(
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 60,
          0
        );
        trna.userData.radius = 5;
        this.scene.add(trna);
        this.simulation.addMolecule(trna);
      }
    } else if (presetName === 'focal-atpsynthase') {
      const atp = createATPSynthaseComplex(this.currentPalette, options);
      atp.position.set(0, -10, 0);
      atp.scale.setScalar(1.5);
      atp.userData.radius = 20;
      this.scene.add(atp);
      this.simulation.addMolecule(atp, true);

      const membrane = createMembraneBilayer(160, 60, this.currentPalette, options);
      membrane.position.y = -16;
      this.scene.add(membrane);
      this.simulation.addMolecule(membrane, true);
    }
  }

  onWindowResize() {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    const aspect = width / height;
    const frustumSize = 160;

    this.camera.left = (frustumSize * aspect) / -2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);

    if (this.outlinePass) {
      const pixelRatio = this.renderer.getPixelRatio();
      this.outlinePass.uniforms['resolution'].value.set(
        width * pixelRatio,
        height * pixelRatio
      );
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = 0.016;

    this.controls.update();
    this.simulation.update(delta);
    this.composer.render();
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new GoodsellCellSimulator();
});
