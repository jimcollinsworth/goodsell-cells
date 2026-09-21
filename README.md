# David Goodsell Cell Simulator (`goodsell-cells`)

An interactive, multi-scale cell simulator rendering molecular structures and intracellular crowding in the iconic visual design language of **David S. Goodsell** (macromolecular space-filling models, flat posterized cel-shading, and hand-drawn ink outline strokes).

![Goodsell Style Rendering](https://ccsb.scripps.edu/goodsell/wp-content/uploads/sites/9/2016/04/Ecoli_crosssection_1,000,000x.jpg)

---

## Key Visual & Architectural Features

1. **Posterized Cel-Shading**: Multi-tone flat diffuse shading (2–3 tone steps) conveying 3D molecular volume without glossy specular reflections.
2. **Sobel Ink-Line Contours**: Custom WebGL post-processing edge detector rendering bold black/dark ink outlines around atomic clusters and subunit boundaries.
3. **Macromolecular Crowding**: Realistic biological density (~350 mg/mL) depicting cytoplasmic matrix, membrane bilayer, and molecular complexes packed in close proximity.
4. **Authentic Functional Palettes**:
   - **E. coli Cytoplasm**: Classic blue/violet nucleic acids, green metabolic enzymes, and pink/orange lipid membrane.
   - **Mycoplasma**: Soft lavender/yellow/coral palette.
   - **SARS-CoV-2 Virion**: Deep teal matrix, red spike glycoproteins, and yellow/green nucleocapsid.
   - **Red Blood Cell**: Deep crimson hemoglobin with plasma proteins.
5. **Multi-Scale Semantic Zoomer**: Smoothly inspect whole-cell cross-sections down to individual functional complexes:
   - **70S Ribosome**
   - **ATP Synthase Machine**
   - **tRNA Transfer RNA**
   - **B-DNA Double Helix**
6. **Pure No-Build Architecture**: Standard HTML5, CSS3, and JavaScript ES Modules (Three.js WebGL engine). Zero Node.js or npm dependencies required.

---

## How to Run

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
└── js/
    ├── main.js           # Three.js scene setup, render loop & post-processing
    ├── goodsell-shader.js# Custom GLSL toon shader material & Sobel outline pass
    ├── pdb-loader.js     # Coarse-grained space-filling PDB molecular generator
    ├── simulation.js     # Brownian motion, molecular crowding & physics dynamics
    ├── palettes.js       # Authentic David Goodsell watercolor color palettes
    └── ui.js             # Interactive controls, preset switcher & inspector HUD
```

---

## Author & Attribution

* **Visual Style Inspired by**: Dr. David S. Goodsell (Scripps Research Institute / RCSB PDB)
* **Code Implementation**: Jim Collinsworth + Antigravity AI
