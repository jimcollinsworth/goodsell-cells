import * as THREE from 'three';

/**
 * Custom GLSL Watercolor Cel-Shading Material for David Goodsell style.
 * Designed for 2D orthographic vector shapes, applying soft watercolor washes,
 * discrete posterized tone steps, and gentle contour shading.
 */
export function createGoodsellMaterial(colorHex, options = {}) {
  const numSteps = Math.max(1.0, options.toneSteps || 3.0);
  const rimIntensity = options.rimIntensity ?? 0.25;

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    uniform vec3 uInkColor;
    uniform float uToneSteps;
    uniform float uRimIntensity;
    uniform vec3 uLightDirection;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      // 2D Directional highlight from top-left (-0.4, 0.4) across shape UVs
      vec2 lightDir2D = normalize(vec2(-0.4, 0.4));
      vec2 centerOffset = vUv - vec2(0.5);
      float distFromCenter = length(centerOffset);
      
      // Top-left highlight & bottom-right shadow wash for 2D volume feel
      float directionalWash = dot(normalize(centerOffset + vec2(0.3, -0.3)), -lightDir2D);
      directionalWash = clamp(directionalWash * 0.5 + 0.5, 0.0, 1.0);
      
      // Soft radial edge darkening (watercolor wash edge)
      float radialWash = 1.0 - smoothstep(0.15, 0.65, distFromCenter) * 0.25;

      float rawLight = mix(0.72, 1.05, directionalWash) * radialWash;

      // Quantize diffuse lighting into discrete Goodsell watercolor tone steps
      float quantizedLight = floor(rawLight * uToneSteps + 0.15) / uToneSteps;
      quantizedLight = clamp(quantizedLight, 0.55, 1.0); // Soft pastel tones, non-black shadow

      // Final Watercolor Cel Color
      vec3 finalColor = uColor * quantizedLight;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uInkColor: { value: new THREE.Color(options.inkColor || '#1a1815') },
      uToneSteps: { value: numSteps },
      uRimIntensity: { value: rimIntensity },
      uLightDirection: { value: new THREE.Vector3(0.3, 0.5, 1.0).normalize() }
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide
  });
}

/**
 * Sobel Edge Detection Shader for Hand-Drawn Ink Outline Pass in 2D Orthographic Mode.
 * Uses 3D RGB color distance across neighboring texels to reliably detect all color boundaries.
 */
export const SobelOutlineShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    resolution: { value: new THREE.Vector2(1024, 1024) },
    outlineThickness: { value: 1.5 },
    outlineThreshold: { value: 0.08 },
    inkColor: { value: new THREE.Color('#1a1815') }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 resolution;
    uniform float outlineThickness;
    uniform float outlineThreshold;
    uniform vec3 inkColor;

    varying vec2 vUv;

    // Sobel edge detection kernels
    mat3 Gx = mat3(
      -1.0, 0.0, 1.0,
      -2.0, 0.0, 2.0,
      -1.0, 0.0, 1.0
    );

    mat3 Gy = mat3(
      -1.0, -2.0, -1.0,
       0.0,  0.0,  0.0,
       1.0,  2.0,  1.0
    );

    void main() {
      vec2 texel = vec2(outlineThickness / resolution.x, outlineThickness / resolution.y);

      vec3 colorX = vec3(0.0);
      vec3 colorY = vec3(0.0);

      for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
          vec2 offset = vec2(float(i - 1), float(j - 1)) * texel;
          vec3 texelColor = texture2D(tDiffuse, vUv + offset).rgb;

          colorX += texelColor * Gx[i][j];
          colorY += texelColor * Gy[i][j];
        }
      }

      float edge = length(colorX) + length(colorY);
      vec4 baseColor = texture2D(tDiffuse, vUv);

      if (edge > outlineThreshold) {
        // Blend ink line smoothly for delicate hand-drawn stroke feel
        float inkFactor = smoothstep(outlineThreshold, outlineThreshold * 2.0, edge);
        gl_FragColor = vec4(mix(baseColor.rgb, inkColor, inkFactor), 1.0);
      } else {
        gl_FragColor = baseColor;
      }
    }
  `
};


