# David Goodsell Cell Simulator (`goodsell-cells`)

An interactive, multi-scale cell simulator rendering molecular structures and intracellular crowding in the iconic 2D visual design language of **Dr. David S. Goodsell** (2D orthographic cross-sectional anatomical slices, continuous watercolor vector shapes, multi-tone cel-shading, and delicate ink outline strokes).

🌐 **Live Demo**: [https://jimcollinsworth.github.io/goodsell-cells/](https://jimcollinsworth.github.io/goodsell-cells/)

![Goodsell Style Rendering](https://ccsb.scripps.edu/goodsell/wp-content/uploads/sites/9/2016/04/Ecoli_crosssection_1,000,000x.jpg)

---

## Key Visual & Architectural Features

1. **2D Orthographic Renderer**: Pure 2D cross-sectional anatomical slice (zero 3D perspective distortion), featuring smooth 2D vector shapes rather than individual overlapping 3D spheres.
2. **Authentic Cell Wall Architecture**:
   - **Outer Membrane Layer**: Wavy lipid bilayer ribbon with embedded OMP porin channels.
   - **Periplasmic Space**: Containing rigid peptidoglycan lattice mesh.
   - **Inner Plasma Membrane**: Lipid bilayer ribbon with respiratory chain complexes.
   - **Flagellar Motor Complex**: Multi-ring rotary motor (C-ring, MS-ring, rod, P-ring, L-ring) spanning cell wall layers, connected to a flexible flagellar filament.
3. **Continuous Watercolor Vector Shapes**: Soft pastel watercolor fills with subtle inner wash gradients, discrete cel-shading steps, and delicate dark ink line outer contours.
4. **Authentic Functional Palettes**:
   - **E. coli Cytoplasm**: Classic blue/violet nucleic acids, green metabolic enzymes, and pink/orange lipid membrane.
   - **Mycoplasma**: Soft lavender/yellow/coral palette.
   - **SARS-CoV-2 Virion**: Deep teal matrix, red spike glycoproteins, and yellow/green nucleocapsid.
   - **Red Blood Cell**: Deep crimson hemoglobin with plasma proteins.
5. **Multi-Scale Semantic Zoomer & 2D Controls**: Drag to pan in 2D, scroll/pinch to zoom orthographically, with preset switcher for:
   - **E. coli Cell Envelope & Cytoplasm (2D Slice)**
   - **70S Ribosome Focus**
   - **ATP Synthase Machine & Membrane Focus**
6. **Pure No-Build Architecture**: Standard HTML5, CSS3, and JavaScript ES Modules (Three.js WebGL engine). Zero Node.js or npm dependencies required.

---

## How to Run Locally

Since `goodsell-cells` uses native ES Modules, it can be served with any simple static HTTP server:

```cmd
cmd /c "python -m http.server 8000"
```

Then open `http://localhost:8000` in your web browser.

---

## File Structure

```
goodsell-cells/
├── index.html            # Main HTML entry point & UI overlay layout
├── README.md             # Project documentation & design principles
├── js/
│   ├── main.js           # 2D Orthographic camera, render loop & post-processing
│   ├── goodsell-shader.js# Custom GLSL 2D watercolor cel-shader & Sobel outline pass
│   ├── pdb-loader.js     # 2D continuous contoured vector molecular & cell wall generator
│   ├── simulation.js     # 2D Brownian motion, molecular crowding & physics dynamics
│   ├── palettes.js       # Authentic David Goodsell watercolor color palettes
│   └── ui.js             # Interactive controls, 2D preset switcher & inspector HUD
└── tests/
    ├── conftest.py       # Pytest fixtures and local HTTP server launcher
    ├── test_browser_startup.py # Playwright 2D browser startup & interaction tests
    ├── test_palettes.py  # Palette definition & hex validation unit tests
    └── test_pdb_structure.py # 2D structure, cell envelope & physics collision tests
```

---

## Author & Attribution

* **Visual Style Inspired by**: Dr. David S. Goodsell (Scripps Research Institute / RCSB PDB)
* **Code Implementation**: Jim Collinsworth + Antigravity AI
