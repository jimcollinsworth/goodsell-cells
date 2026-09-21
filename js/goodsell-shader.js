import * as THREE from 'three';

/**
 * Custom GLSL Cel-Shading Material for David Goodsell style
 * Quantizes diffuse lighting into discrete flat tone steps (2, 3, or 4 steps)
 * and applies rich flat color fills.
 */
export function createGoodsellMaterial(colorHex, options = {}) {
  const numSteps = options.toneSteps || 3.0;
  const rimIntensity = options.rimIntensity || 0.25;

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
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

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      vec3 lightDir = normalize(uLightDirection);

      // Diffuse Lambertian term
      float NdotL = max(dot(normal, lightDir), 0.0);

      // Quantize diffuse lighting into discrete Goodsell tone steps
      float stepSize = 1.0 / uToneSteps;
      float quantizedLight = floor(NdotL * uToneSteps + 0.5) / uToneSteps;
      quantizedLight = clamp(quantizedLight, 0.35, 1.0); // Keep shadows soft and non-black

      // Subtle Rim / Contour lighting
      float rim = 1.0 - max(dot(viewDir, normal), 0.0);
      rim = pow(rim, 3.0) * uRimIntensity;

      // Final Posterized Shaded Color
      vec3 finalColor = uColor * quantizedLight + (uColor * rim * 0.4);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uInkColor: { value: new THREE.Color('#1a1815') },
      uToneSteps: { value: numSteps },
      uRimIntensity: { value: rimIntensity },
      uLightDirection: { value: new THREE.Vector3(0.5, 0.8, 1.0).normalize() }
    },
    vertexShader,
    fragmentShader,
    side: THREE.FrontSide
  });
}

/**
 * Sobel Edge Detection Shader for Hand-Drawn Ink Outline Pass
 */
export const SobelOutlineShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    resolution: { value: new THREE.Vector2(1024, 1024) },
    outlineThickness: { value: 1.5 },
    outlineThreshold: { value: 0.15 },
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

    // Sobel kernels
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
        // Blend in ink line smoothly
        float inkFactor = smoothstep(outlineThreshold, outlineThreshold * 2.0, edge);
        gl_FragColor = vec4(mix(baseColor.rgb, inkColor, inkFactor), 1.0);
      } else {
        gl_FragColor = baseColor;
      }
    }
  `
};
