import { GOODSELL_PALETTES } from './palettes.js';

export class SimulatorUI {
  constructor(app) {
    this.app = app;
    this.tooltipEl = document.getElementById('inspector-tooltip');
    this.bindEvents();
  }

  bindEvents() {
    // Palette selection
    const paletteSelect = document.getElementById('palette-select');
    if (paletteSelect) {
      paletteSelect.addEventListener('change', (e) => {
        this.app.setPalette(e.target.value);
      });
    }

    // Preset scene selection
    const sceneSelect = document.getElementById('scene-select');
    if (sceneSelect) {
      sceneSelect.addEventListener('change', (e) => {
        this.app.loadScenePreset(e.target.value);
      });
    }

    // Outline thickness slider
    const outlineSlider = document.getElementById('outline-slider');
    if (outlineSlider) {
      outlineSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.app.setOutlineThickness(val);
        document.getElementById('outline-val').textContent = val.toFixed(1) + 'px';
      });
    }

    // Cel tone steps slider
    const toneSlider = document.getElementById('tone-slider');
    if (toneSlider) {
      toneSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this.app.setToneSteps(val);
        document.getElementById('tone-val').textContent = val + ' steps';
      });
    }

    // Speed slider
    const speedSlider = document.getElementById('speed-slider');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.app.simulation.setSpeed(val);
        document.getElementById('speed-val').textContent = val.toFixed(1) + 'x';
      });
    }

    // Pause toggle
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        const isPaused = this.app.simulation.togglePause();
        pauseBtn.textContent = isPaused ? '▶ Play' : '⏸ Pause';
        pauseBtn.classList.toggle('active', isPaused);
      });
    }

    // Reset camera button
    const resetCamBtn = document.getElementById('btn-reset-cam');
    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', () => {
        this.app.resetCamera();
      });
    }
  }

  showTooltip(x, y, data) {
    if (!this.tooltipEl || !data) return;
    this.tooltipEl.style.display = 'block';

    const padding = 15;
    const tooltipWidth = 260;
    const tooltipHeight = 110;

    let left = x + padding;
    let top = y + padding;

    if (left + tooltipWidth > window.innerWidth) {
      left = Math.max(10, x - tooltipWidth - 10);
    }
    if (top + tooltipHeight > window.innerHeight) {
      top = Math.max(10, y - tooltipHeight - 10);
    }

    this.tooltipEl.style.left = `${left}px`;
    this.tooltipEl.style.top = `${top}px`;

    this.tooltipEl.innerHTML = `
      <div class="tooltip-title">${data.name || 'Macromolecule'}</div>
      ${data.pdbId ? `<div class="tooltip-badge">PDB: ${data.pdbId}</div>` : ''}
      ${data.weight ? `<div class="tooltip-meta"><strong>Mass:</strong> ${data.weight}</div>` : ''}
      <div class="tooltip-desc">${data.function || 'Intracellular component'}</div>
    `;
  }

  hideTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.style.display = 'none';
    }
  }
}
