/**
 * Authentic David Goodsell Color Palettes
 * Mapped by functional macromolecular categories:
 * - nucleic: DNA, RNA, tRNA, Ribosomes
 * - enzyme: Metabolic enzymes, synthesis machinery
 * - membrane: Lipids, fatty acid chains, channel proteins
 * - structural: Cytoskeleton, viral matrix, capsids
 * - plasma: Extracellular proteins, antibodies, plasma
 */

export const GOODSELL_PALETTES = {
  ecoli: {
    name: 'E. coli Cytoplasm (Classic)',
    description: 'Goodsell landmark watercolor palette of bacterium cross-section',
    bg: '#f7f4ea',
    inkColor: '#1a1815',
    categories: {
      nucleic: ['#3b5998', '#4b6fb6', '#5c82cc', '#2d4373', '#6f94dc'], // Blue / Purple range
      enzyme: ['#498b53', '#5ea869', '#74c480', '#366d3e', '#8bd997'],  // Green range
      membrane: ['#d96b52', '#e5836d', '#f09c88', '#bd5038', '#f7b4a3'],// Pink / Orange range
      structural: ['#3a8891', '#4aa3ad', '#5ebec8', '#2b686f', '#77d7e1'],// Cyan / Teal
      plasma: ['#c9a857', '#dba744', '#ecc469', '#aa8233', '#f5d688']  // Gold / Ochre
    }
  },
  mycoplasma: {
    name: 'Mycoplasma Genitalium',
    description: 'Minimal cell palette with soft purple genome and warm enzyme matrix',
    bg: '#f5f0eb',
    inkColor: '#181412',
    categories: {
      nucleic: ['#7b5294', '#9167aa', '#a87ec1', '#623a7b', '#be94d8'], // Lavender / Purple
      enzyme: ['#c98a2c', '#de9f3f', '#f0b454', '#aa7019', '#f7c96d'],  // Ochre / Amber
      membrane: ['#c75c5c', '#db7474', '#eb8d8d', '#aa4444', '#f5a6a6'],// Soft Red / Coral
      structural: ['#4b7b94', '#6093ac', '#77abc4', '#346078', '#8fc2db'],// Slate Blue
      plasma: ['#b3a27b', '#c7b68f', '#dbcaa3', '#968560', '#ebdcb7']  // Muted Tan
    }
  },
  sarscov2: {
    name: 'SARS-CoV-2 Virion',
    description: 'Viral envelope, red spike glycoproteins, and teal matrix',
    bg: '#f2f5f4',
    inkColor: '#121a18',
    categories: {
      nucleic: ['#d9822b', '#eb963e', '#faab52', '#b86919', '#fcbe6d'], // Yellow-orange RNA
      enzyme: ['#2e8b80', '#42a397', '#58baae', '#1d6e64', '#70d1c5'],  // Teal matrix
      membrane: ['#78909c', '#90a4ae', '#b0bec5', '#546e7a', '#cfd8dc'],// Steel Grey lipid
      structural: ['#c62828', '#e53935', '#ef5350', '#9a0007', '#e57373'],// Bright Red Spike
      plasma: ['#7e57c2', '#9575cd', '#b39ddb', '#512da8', '#d1c4e9']  // Muted Violet
    }
  },
  blood: {
    name: 'Red Blood Cell & Plasma',
    description: 'Deep crimson hemoglobin packed inside erythrocyte surrounded by serum',
    bg: '#faf2ef',
    inkColor: '#1f100e',
    categories: {
      nucleic: ['#5c6bc0', '#7986cb', '#9fa8da', '#3949ab', '#c5cae9'], // Rare nuclear factors
      enzyme: ['#b71c1c', '#c62828', '#d32f2f', '#8e0000', '#e57373'],  // Crimson Hemoglobin
      membrane: ['#ef6c00', '#f57c00', '#ff9800', '#e65100', '#ffb74d'],// Orange Erythrocyte coat
      structural: ['#8d6e63', '#a1887f', '#bcaaa4', '#5d4037', '#d7ccc8'],// Cytoskeletal spectrin
      plasma: ['#fbc02d', '#fdd835', '#ffee58', '#f57f17', '#fff59d']  // Plasma Albumin / Serum
    }
  }
};

/**
 * Get a color from a palette category by index or random pick
 */
export function getPaletteColor(paletteName, category, index = 0) {
  const palette = GOODSELL_PALETTES[paletteName] || GOODSELL_PALETTES.ecoli;
  const list = palette.categories[category] || palette.categories.enzyme;
  return list[index % list.length];
}
