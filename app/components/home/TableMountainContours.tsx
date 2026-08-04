import {useEffect, useRef} from 'react';
import * as THREE from 'three';

export default function TableMountainContours() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
    camera.position.set(2.12, 3.6, 11.71);
    camera.lookAt(0, 1.28, -0.3);

    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const terrainResolution = 512;
    const geometry = new THREE.PlaneGeometry(
      13,
      13,
      terrainResolution - 1,
      terrainResolution - 1,
    );
    geometry.rotateX(-Math.PI / 2);
    const heightValues = new Float32Array(
      terrainResolution * terrainResolution,
    );
    const heightAttribute = new THREE.BufferAttribute(heightValues, 1);
    geometry.setAttribute('terrainHeight', heightAttribute);
    let isDisposed = false;
    fetch('/models/table-mountain-heightfield.bin?v=3')
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        if (isDisposed) return;
        const encoded = new Uint16Array(buffer);
        for (let row = 0; row < terrainResolution; row += 1) {
          for (let column = 0; column < terrainResolution; column += 1) {
            const geometryIndex = row * terrainResolution + column;
            const sourceIndex =
              (terrainResolution - 1 - row) * terrainResolution + column;
            heightValues[geometryIndex] = (encoded[sourceIndex] / 65535) * 2.27;
          }
        }
        heightAttribute.needsUpdate = true;
      })
      .catch((error: unknown) => {
        if (!isDisposed) {
          console.error('Failed to load the Table Mountain heightfield', error);
        }
      });

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: {value: 0},
      },
      vertexShader: `
        attribute float terrainHeight;
        varying float vHeight;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;

        void main() {
          vHeight = terrainHeight;
          vNormal = normalize(normalMatrix * normal);
          vec3 terrainPosition = position;
          terrainPosition.y = terrainHeight;
          vec4 world = modelMatrix * vec4(terrainPosition, 1.0);
          vWorldPosition = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying float vHeight;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;

        void main() {
          float elevation = vHeight * 8.6 + sin(vWorldPosition.x * 0.7 + uTime * 0.08) * 0.08;
          float contourDistance = abs(fract(elevation) - 0.5);
          float contourWidth = fwidth(elevation) * 0.72;
          float contour = 1.0 - smoothstep(contourWidth, contourWidth * 2.4, contourDistance);
          float contourHalo = 1.0 - smoothstep(
            contourWidth * 2.0,
            contourWidth * 8.5,
            contourDistance
          );

          float minorElevation = vHeight * 25.8;
          float minorDistance = abs(fract(minorElevation) - 0.5);
          float minor = (1.0 - smoothstep(fwidth(minorElevation), fwidth(minorElevation) * 2.0, minorDistance)) * 0.2;
          float detailElevation = vHeight * 60.2;
          float detailDistance = abs(fract(detailElevation) - 0.5);
          float detailWidth = fwidth(detailElevation);
          float detailContour = (
            1.0 - smoothstep(
              detailWidth * 0.72,
              detailWidth * 1.8,
              detailDistance
            )
          ) * 0.115;

          float terrain = smoothstep(0.025, 0.24, vHeight);
          float edgeFade = smoothstep(8.5, 5.4, abs(vWorldPosition.x));
          edgeFade *= smoothstep(4.7, 3.25, abs(vWorldPosition.z));
          vec3 surfaceNormal = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
          vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
          float facing = 0.38 + pow(max(0.0, dot(surfaceNormal, normalize(vec3(0.15, 0.72, 0.68)))), 2.0) * 0.78;
          float rim = pow(1.0 - abs(dot(surfaceNormal, viewDirection)), 3.2);
          float pulse = 0.88 + sin(uTime * 0.3 + vWorldPosition.x * 0.5) * 0.08;
          float contourLevel = floor(elevation);
          float runnerPhase = fract(
            vWorldPosition.x * 0.082 +
            vWorldPosition.z * 0.052 -
            uTime * (0.045 + mod(contourLevel, 4.0) * 0.008) +
            contourLevel * 0.173
          );
          float runnerShape = smoothstep(0.0, 0.055, runnerPhase) *
            (1.0 - smoothstep(0.14, 0.38, runnerPhase));
          float levelRandom = fract(sin(contourLevel * 12.9898) * 43758.5453);
          float levelGate = 0.18 + smoothstep(0.48, 0.82, levelRandom) * 0.82;
          float runnerCore = runnerShape * contour * levelGate;
          float runnerGlow = runnerShape * contourHalo * levelGate;
          float secondPhase = fract(
            -vWorldPosition.x * 0.057 +
            vWorldPosition.z * 0.041 -
            uTime * 0.026 +
            contourLevel * 0.091
          );
          float secondShape = smoothstep(0.0, 0.07, secondPhase) *
            (1.0 - smoothstep(0.16, 0.42, secondPhase));
          float secondGate = 0.12 + smoothstep(0.62, 0.9, 1.0 - levelRandom) * 0.58;
          float secondCore = secondShape * contour * secondGate;
          float secondGlow = secondShape * contourHalo * secondGate;
          float majorContour = 1.0 - step(0.5, mod(contourLevel, 5.0));
          float depthHaze = 1.0 - smoothstep(
            5.0,
            13.5,
            length(cameraPosition - vWorldPosition)
          );
          float grain = fract(
            sin(dot(gl_FragCoord.xy + uTime * 0.17, vec2(12.9898, 78.233))) *
            43758.5453
          );
          float sparks = smoothstep(0.986, 1.0, grain) *
            (runnerGlow + secondGlow) * contourHalo;
          float alpha = (
            (contour * (0.25 + majorContour * 0.1) + minor * 0.075) * facing +
            detailContour * facing * 0.42 +
            rim * 0.055 +
            runnerCore * 1.18 +
            runnerGlow * 0.52 +
            secondCore * 0.72 +
            secondGlow * 0.3 +
            sparks * 1.35
          ) * terrain * edgeFade * pulse * (0.72 + depthHaze * 0.28);
          vec3 iceBlue = vec3(0.28, 0.43, 0.52);
          vec3 highlight = vec3(0.88, 0.95, 1.0);
          vec3 color = mix(
            iceBlue,
            highlight,
            clamp(
              contour * 0.42 +
              rim * 0.18 +
              runnerCore +
              runnerGlow * 0.45 +
              secondCore * 0.65 +
              sparks,
              0.0,
              1.0
            )
          );
          gl_FragColor = vec4(
            color * (
              0.38 +
              contour * 0.26 +
              rim * 0.16 +
              runnerCore * 2.15 +
              runnerGlow * 1.08 +
              secondCore * 1.2 +
              secondGlow * 0.52 +
              sparks * 2.0
            ),
            alpha
          );
        }
      `,
    });

    const terrain = new THREE.Mesh(geometry, material);
    terrain.position.y = 0.12;
    terrain.rotation.x = -0.025;
    terrain.rotation.y = Math.PI - 0.08 + Math.PI / 12;
    scene.add(terrain);

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      renderer.setSize(bounds.width, bounds.height, false);
      camera.aspect = bounds.width / Math.max(1, bounds.height);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const clock = new THREE.Clock();
    let animationFrame = 0;
    const render = () => {
      const time = clock.getElapsedTime();
      material.uniforms.uTime.value = time;
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(render);
    };
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <section className="table-mountain-contours" aria-label="Table Mountain">
      <div className="table-mountain-contours__canvas" ref={hostRef} />
    </section>
  );
}
