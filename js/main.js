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
  createMembraneBilayer
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

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    this.camera.position.set(0, 0, 140);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 350;
    this.controls.minDistance = 20;

    // Ambient & Directional Lighting for Cel-Shading
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 80);
    this.scene.add(dirLight);
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.outlinePass = new ShaderPass(SobelOutlineShader);
    this.outlinePass.uniforms['resolution'].value.set(
      window.innerWidth * window.devicePixelRatio,
      window.innerHeight * window.devicePixelRatio
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
      // 1. Top & Bottom Membrane Bilayer Boundaries
      const topMembrane = createMembraneBilayer(140, 70, this.currentPalette, options);
      topMembrane.position.y = 35;
      this.scene.add(topMembrane);
      this.simulation.addMolecule(topMembrane, true);

      const botMembrane = createMembraneBilayer(140, 70, this.currentPalette, options);
      botMembrane.position.y = -35;
      this.scene.add(botMembrane);
      this.simulation.addMolecule(botMembrane, true);

      // 2. Central 70S Ribosomes
      const ribo1 = createRibosomeComplex(this.currentPalette, options);
      ribo1.position.set(-25, 0, 10);
      ribo1.userData.radius = 16;
      this.scene.add(ribo1);
      this.simulation.addMolecule(ribo1);

      const ribo2 = createRibosomeComplex(this.currentPalette, options);
      ribo2.position.set(25, 5, -15);
      ribo2.userData.radius = 16;
      this.scene.add(ribo2);
      this.simulation.addMolecule(ribo2);

      // 3. DNA Double Helix Strand
      const dna = createDNAStrand(100, this.currentPalette, options);
      dna.position.set(0, -10, 0);
      dna.rotation.z = Math.PI / 6;
      dna.userData.radius = 12;
      this.scene.add(dna);
      this.simulation.addMolecule(dna, true);

      // 4. ATP Synthase Embedded in Membrane
      const atp = createATPSynthaseComplex(this.currentPalette, options);
      atp.position.set(-45, 20, 5);
      atp.userData.radius = 14;
      this.scene.add(atp);
      this.simulation.addMolecule(atp, true);

      // 5. Crowded Cytoplasmic Enzymes & tRNAs
      for (let i = 0; i < 16; i++) {
        const categories = ['enzyme', 'structural', 'plasma'];
        const cat = categories[i % categories.length];
        const enzyme = createEnzymeBlob(8 + Math.random() * 4, this.currentPalette, cat, options);
        enzyme.position.set(
          (Math.random() - 0.5) * 80,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40
        );
        enzyme.userData.radius = 6;
        this.scene.add(enzyme);
        this.simulation.addMolecule(enzyme);
      }

      for (let i = 0; i < 6; i++) {
        const trna = createtRNA(this.currentPalette, options);
        trna.position.set(
          (Math.random() - 0.5) * 70,
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 30
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

      // Surround with floating tRNAs
      for (let i = 0; i < 8; i++) {
        const trna = createtRNA(this.currentPalette, options);
        trna.position.set(
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50
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

      const membrane = createMembraneBilayer(120, 60, this.currentPalette, options);
      membrane.position.y = -14;
      this.scene.add(membrane);
      this.simulation.addMolecule(membrane, true);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);

    if (this.outlinePass) {
      this.outlinePass.uniforms['resolution'].value.set(
        window.innerWidth * window.devicePixelRatio,
        window.innerHeight * window.devicePixelRatio
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
