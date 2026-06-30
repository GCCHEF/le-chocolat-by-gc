import * as THREE from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import vertexShaderSource from './vertex.glsl?raw';
import fragmentShaderSource from './fragment.glsl?raw';
import noiseShaderSource from './noise.glsl?raw';

const canvas = document.querySelector('#matiere-canvas');
const webgl2 = canvas.getContext('webgl2', {
  antialias: false,
  alpha: false,
  depth: true,
  stencil: false,
  powerPreference: 'high-performance',
});

if (!webgl2) {
  throw new Error('This prototype requires WebGL2.');
}

const vertexShader = vertexShaderSource.replace(
  '#include "./noise.glsl"',
  noiseShaderSource,
);
const fragmentShader = fragmentShaderSource.replace(
  '#include "./noise.glsl"',
  noiseShaderSource,
);

const renderer = new THREE.WebGLRenderer({
  canvas,
  context: webgl2,
  antialias: false,
  powerPreference: 'high-performance',
});

renderer.setClearColor(0x000000, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.3));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.58;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
camera.position.set(0, 0.02, 5.85);

const startedAt = performance.now();
const pointer = new THREE.Vector2();
const smoothPointer = new THREE.Vector2();
const keyLight = new THREE.Vector3(-3.2, 1.15, 2.65);
const whiteRim = new THREE.Vector3(2.4, 2.0, 2.9);
const mouseLight = new THREE.Vector3(0.0, 0.2, 3.6);

const liquidMaterial = new THREE.RawShaderMaterial({
  glslVersion: THREE.GLSL3,
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: {value: 0},
    uCameraPosition: {value: camera.position},
    uKeyLight: {value: keyLight},
    uRimLight: {value: whiteRim},
    uMouseLight: {value: mouseLight},
  },
});

// Marching cubes gives the sculpture real topology changes: ribbons merge,
// cavities open, necks pinch, and the surface relaxes without mesh rotation.
const sculpture = new MarchingCubes(72, liquidMaterial, false, false, 180000);
sculpture.isolation = 84;
sculpture.scale.set(2.28, 1.18, 1.08);
sculpture.rotation.set(-0.08, 0.0, 0.02);
scene.add(sculpture);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.16, 0.96, 0.82);

const cinematicPass = new ShaderPass({
  uniforms: {
    tDiffuse: {value: null},
    uResolution: {value: new THREE.Vector2(1, 1)},
    uAberration: {value: 0.0014},
    uVignette: {value: 0.62},
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uAberration;
    uniform float uVignette;
    varying vec2 vUv;

    void main() {
      vec2 center = vUv - 0.5;
      float edge = smoothstep(0.16, 0.72, length(center));
      vec2 direction = normalize(center + 0.0001);
      vec2 offset = direction * uAberration * edge;
      vec2 focusDrift = direction * 0.0012 * smoothstep(0.36, 0.86, length(center));

      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      vec3 color = vec3(r, g, b);

      // A very light focus falloff: cheaper than full depth of field and
      // restrained enough to keep the sculpture crisp.
      vec3 soft = (
        texture2D(tDiffuse, vUv + focusDrift).rgb +
        texture2D(tDiffuse, vUv - focusDrift).rgb
      ) * 0.5;
      color = mix(color, soft, edge * 0.12);

      float vignette = smoothstep(0.96, 0.22, length(center * vec2(uResolution.x / uResolution.y, 1.0)));
      color *= mix(1.0 - uVignette, 1.0, vignette);
      color = pow(max(color, 0.0), vec3(0.98));

      gl_FragColor = vec4(color, 1.0);
    }
  `,
});
const outputPass = new OutputPass();

composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(cinematicPass);
composer.addPass(outputPass);

const liquidRibbons = [
  {
    seed: 0.0,
    samples: 44,
    subtract: 12.8,
    strength: 0.112,
    closed: true,
    points: [
      [0.13, 0.52, 0.49],
      [0.24, 0.64, 0.43],
      [0.41, 0.66, 0.5],
      [0.57, 0.57, 0.62],
      [0.74, 0.49, 0.57],
      [0.9, 0.54, 0.49],
      [0.78, 0.39, 0.44],
      [0.58, 0.34, 0.39],
      [0.35, 0.36, 0.46],
      [0.18, 0.43, 0.55],
    ],
  },
  {
    seed: 2.6,
    samples: 38,
    subtract: 13.3,
    strength: 0.092,
    closed: true,
    points: [
      [0.28, 0.42, 0.63],
      [0.42, 0.58, 0.68],
      [0.58, 0.61, 0.56],
      [0.73, 0.52, 0.45],
      [0.66, 0.37, 0.35],
      [0.47, 0.3, 0.42],
      [0.3, 0.35, 0.55],
    ],
  },
  {
    seed: 5.1,
    samples: 32,
    subtract: 14.0,
    strength: 0.078,
    closed: false,
    points: [
      [0.22, 0.6, 0.52],
      [0.38, 0.49, 0.43],
      [0.52, 0.46, 0.5],
      [0.66, 0.55, 0.6],
      [0.82, 0.47, 0.52],
    ],
  },
  {
    seed: 8.4,
    samples: 34,
    subtract: 14.6,
    strength: 0.066,
    closed: false,
    points: [
      [0.28, 0.27, 0.52],
      [0.38, 0.38, 0.55],
      [0.52, 0.5, 0.49],
      [0.64, 0.63, 0.44],
      [0.72, 0.78, 0.51],
    ],
  },
];

const cavities = [
  {seed: 2.4, position: [0.5, 0.55, 0.5], radius: [0.05, 0.04, 0.034], strength: -0.128, subtract: 10.3},
  {seed: 5.9, position: [0.61, 0.47, 0.52], radius: [0.052, 0.032, 0.034], strength: -0.1, subtract: 10.7},
  {seed: 10.7, position: [0.37, 0.45, 0.55], radius: [0.035, 0.044, 0.04], strength: -0.08, subtract: 11.1},
];

function easeSurfaceTension(value) {
  return 0.5 - Math.cos(value * Math.PI) * 0.5;
}

function smoothstep(edge0, edge1, value) {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

function makeCurve(points, time, seed, closed) {
  const animatedPoints = points.map(([x, y, z], index) => {
    const phase = time * 0.024 + seed + index * 1.618;
    return new THREE.Vector3(
      x + Math.sin(phase) * 0.01 + Math.sin(time * 0.012 + seed) * 0.004,
      y + Math.cos(phase * 0.83) * 0.009,
      z + Math.sin(phase * 1.17) * 0.01,
    );
  });

  return new THREE.CatmullRomCurve3(animatedPoints, closed, 'centripetal', 0.38);
}

function addLiquidRibbon(curveConfig, time) {
  const curve = makeCurve(curveConfig.points, time, curveConfig.seed, curveConfig.closed);

  for (let i = 0; i < curveConfig.samples; i += 1) {
    const t = curveConfig.closed
      ? i / curveConfig.samples
      : i / (curveConfig.samples - 1);
    const point = curve.getPoint(t);
    const endBulge = curveConfig.closed
      ? 0.0
      : Math.max(Math.pow(1.0 - t, 5.0), Math.pow(t, 5.0));
    const massFlow =
      0.5 +
      0.5 *
        Math.sin(
          time * 0.045 +
            curveConfig.seed +
            Math.sin(time * 0.011 + curveConfig.seed) * 1.1 +
            t * Math.PI * 2.0,
        );
    const neckWave =
      0.5 +
      0.5 * Math.sin(time * 0.038 + curveConfig.seed + t * Math.PI * 3.4);
    const pressure = easeSurfaceTension(massFlow);
    const neck = 1.0 - smoothstep(0.46, 0.82, neckWave) * 0.17;
    const swell = 0.92 + pressure * 0.24;
    const strength =
      curveConfig.strength *
      (swell + endBulge * 0.38) *
      neck *
      (0.99 + Math.sin(time * 0.013 + curveConfig.seed + t * 4.2) * 0.026);

    sculpture.addBall(point.x, point.y, point.z, strength, curveConfig.subtract);

    // Offset samples widen each path into a fused liquid sheet. This is what
    // hides the construction and moves the silhouette away from discrete blobs.
    const tangent = curve.getTangent(t);
    const side = new THREE.Vector3(-tangent.y, tangent.x, tangent.z * 0.25).normalize();
    const ribbonWidth =
      0.022 +
      pressure * 0.014 +
      Math.sin(time * 0.018 + curveConfig.seed + t * 4.0) * 0.0025;

    for (const direction of [-1, 1]) {
      const sideOffset = side.clone().multiplyScalar(ribbonWidth * direction);
      sculpture.addBall(
        point.x + sideOffset.x,
        point.y + sideOffset.y,
        point.z + sideOffset.z,
        strength * 0.54,
        curveConfig.subtract + 1.1,
      );
    }
  }
}

function addLiquidField(time) {
  sculpture.reset();

  for (const curve of liquidRibbons) {
    addLiquidRibbon(curve, time);
  }

  // Soft internal reservoirs make the loops fuse into one continuous body
  // while still allowing thin necks and large holes to breathe open.
  for (let i = 0; i < 12; i += 1) {
    const phase = time * 0.022 + i * 0.77;
    const pressure = easeSurfaceTension(Math.sin(phase * 0.7) * 0.5 + 0.5);
    sculpture.addBall(
      0.5 + Math.sin(phase) * 0.082,
      0.5 + Math.cos(phase * 0.73) * 0.044,
      0.5 + Math.sin(phase * 1.13) * 0.048,
      0.108 + pressure * 0.014,
      14.4,
    );
  }

  for (const cavity of cavities) {
    const phase = time * 0.034 + cavity.seed;
    const open = easeSurfaceTension(Math.sin(phase * 0.9) * 0.5 + 0.5);
    sculpture.addBall(
      cavity.position[0] + Math.sin(phase) * cavity.radius[0],
      cavity.position[1] + Math.cos(phase * 1.2) * cavity.radius[1],
      cavity.position[2] + Math.sin(phase * 0.9) * cavity.radius[2],
      cavity.strength * (0.55 + open * 0.75),
      cavity.subtract,
    );
  }

  sculpture.update();
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  composer.setSize(width, height);
  bloomPass.setSize(width, height);
  cinematicPass.uniforms.uResolution.value.set(width, height);
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function render() {
  const elapsed = (performance.now() - startedAt) * 0.001;
  const time =
    elapsed * 0.32 +
    Math.sin(elapsed * 0.018) * 3.8 +
    Math.sin(elapsed * 0.006) * 8.5;

  smoothPointer.lerp(pointer, 0.012);
  addLiquidField(time);

  liquidMaterial.uniforms.uTime.value = time;
  mouseLight.set(smoothPointer.x * 0.22, 0.15 + smoothPointer.y * 0.1, 3.6);
  keyLight.set(
    -3.2 + Math.sin(elapsed * 0.025) * 0.06 + smoothPointer.x * 0.035,
    1.15 + Math.sin(elapsed * 0.021) * 0.04,
    2.65,
  );

  camera.position.x = smoothPointer.x * 0.006 + Math.sin(elapsed * 0.01) * 0.012;
  camera.position.y = 0.03 + smoothPointer.y * 0.005 + Math.sin(elapsed * 0.008) * 0.007;
  camera.lookAt(0, 0, 0);

  composer.render();
  requestAnimationFrame(render);
}

window.addEventListener('resize', resize);
window.addEventListener('pointermove', onPointerMove, {passive: true});

resize();
render();
