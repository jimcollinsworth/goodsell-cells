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
      vec3 normal = normalize(vNormal);
      vec3 lightDir = normalize(uLightDirection);

      // 2D Watercolor Wash: Radial gradient from UV center (0.5, 0.5)
      vec2 centerOffset = vUv - vec2(0.5);
      float distFromCenter = length(centerOffset);
      float watercolorWash = 1.0 - smoothstep(0.0, 0.7, distFromCenter) * 0.25;

      // Soft directional lighting term for 2D volume feel
      float NdotL = max(dot(normal, lightDir), 0.0);
      float rawLight = mix(0.7, 1.0, NdotL) * watercolorWash;

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
 * Sobel Edge Detection Shader for Hand-Drawn Ink Outline Pass in 2D Orthographic Mode
 */
export const SobelOutlineShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    resolution: { value: new THREE.Vector2(1024, 1024) },
    outlineThickness: { value: 1.5 },
    outlineThreshold: { value: 0.10 },
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

    float getLuminance(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }

    void main() {
      vec2 texel = vec2(outlineThickness / resolution.x, outlineThickness / resolution.y);

      float edgeX = 0.0;
      float edgeY = 0.0;

      for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
          vec2 offset = vec2(float(i - 1), float(j - 1)) * texel;
          vec4 texelColor = texture2D(tDiffuse, vUv + offset);
          float val = getLuminance(texelColor.rgb);

          edgeX += val * Gx[i][j];
          edgeY += val * Gy[i][j];
        }
      }

      float edge = sqrt(edgeX * edgeX + edgeY * edgeY);
      vec4 baseColor = texture2D(tDiffuse, vUv);

      if (edge > outlineThreshold) {
        // Blend ink line smoothly for delicate hand-drawn stroke feel
        float inkFactor = smoothstep(outlineThreshold, outlineThreshold * 1.8, edge);
        gl_FragColor = vec4(mix(baseColor.rgb, inkColor, inkFactor), 1.0);
      } else {
        gl_FragColor = baseColor;
      }
    }
  `
};

