import {useEffect, useRef} from 'react';
import type {ShaderMaterial, WebGLRenderer} from 'three';

const MAX_TOUCHES = 5;

const fragmentShader = `
  precision highp float;
  uniform vec2 iResolution;
  uniform vec2 iTouches[5];
  uniform float iPressures[5];
  uniform float iTime;
  uniform float iZoom;
  uniform float iStretch;
  uniform vec2 iCenter;

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 st) {
    float value = 0.0;
    float amp = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 4; i++) {
      value += amp * snoise(st);
      st = rot * st * 2.1 + 10.0;
      amp *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 aspect = vec2(iResolution.x / iResolution.y, 1.0);
    vec2 p = (uv - 0.5) * aspect;
    vec2 center = (iCenter - 0.5) * aspect;

    p = (p - center) * iZoom + center;
    p.x *= (1.0 + iStretch * 0.5);
    p.y *= (1.0 - iStretch * 0.2);

    vec2 totalDistortion = vec2(0.0);
    for(int i = 0; i < 5; i++) {
      vec2 m = (iTouches[i].xy / iResolution.xy - 0.5) * aspect;
      m = (m - center) * iZoom + center;

      float d = length(p - m);
      float pull = exp(-d * 2.2) * iPressures[i];
      totalDistortion += (m - p) * pull * 1.4;
    }

    vec2 pD = p + totalDistortion;

    float flowTime = iTime * 1.15;
    vec2 q = vec2(fbm(pD + flowTime * 0.00726), fbm(pD + vec2(1.0)));
    vec2 r = vec2(
      fbm(pD + 1.2*q + vec2(1.7, 9.2) + flowTime * 0.0029),
      fbm(pD + 1.2*q + vec2(8.3, 2.8) + flowTime * 0.00145)
    );

    float f = fbm(pD + r);

    vec3 baseDark = vec3(0.04, 0.04, 0.05);
    vec3 silver = vec3(0.72, 0.74, 0.77);
    vec3 color = mix(baseDark, vec3(0.0), clamp((f*f)*4.5, 0.0, 1.0));

    color = mix(color, silver, clamp(length(q), 0.0, 1.0));
    color = mix(color, vec3(0.1), clamp(length(r.x), 0.0, 1.0));

    float spec = pow(max(0.0, f), 4.0) * 0.5;
    color += vec3(0.6) * spec;

    color *= smoothstep(1.4, 0.35, length(uv - 0.5));
    gl_FragColor = vec4(color, 1.0);
  }
`;

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export default function ShaderSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animationFrame = 0;
    let renderer: WebGLRenderer | null = null;
    let material: ShaderMaterial | null = null;
    let isDisposed = false;

    async function initShader() {
      const container = containerRef.current;
      if (!container) return;

      const THREE = await import('three');
      if (isDisposed || !containerRef.current) return;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.className = 'shader-section__canvas';
      container.appendChild(renderer.domElement);

      const state = {
        center: new THREE.Vector2(0.5, 0.5),
      };

      const touchPoints = Array.from({length: MAX_TOUCHES}, () => ({
        current: new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
        target: new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
        pressure: 0,
        active: false,
      }));

      material = new THREE.ShaderMaterial({
        uniforms: {
          iTime: {value: 0},
          iResolution: {value: new THREE.Vector2(1, 1)},
          iTouches: {value: touchPoints.map((touch) => touch.current)},
          iPressures: {value: new Float32Array(MAX_TOUCHES)},
          iZoom: {value: 1.0},
          iStretch: {value: 0.0},
          iCenter: {value: new THREE.Vector2(0.5, 0.5)},
        },
        vertexShader,
        fragmentShader,
      });

      const geometry = new THREE.PlaneGeometry(2, 2);
      scene.add(new THREE.Mesh(geometry, material));

      const getSize = () => {
        const rect = container.getBoundingClientRect();
        return {
          width: Math.max(1, Math.round(rect.width)),
          height: Math.max(1, Math.round(rect.height)),
        };
      };

      const resize = () => {
        if (!renderer || !material) return;
        const {width, height} = getSize();
        renderer.setSize(width, height, false);
        material.uniforms.iResolution.value.set(width, height);
      };

      const setTouchTarget = (index: number, clientX: number, clientY: number) => {
        const {height} = getSize();
        touchPoints[index].target.set(clientX, height - clientY);
      };

      const handleTouch = (event: TouchEvent) => {
        const {height} = getSize();
        const touchCount = event.touches.length;

        for (const touchPoint of touchPoints) {
          touchPoint.active = false;
        }

        if (touchCount >= 1) {
          for (let i = 0; i < Math.min(touchCount, MAX_TOUCHES); i++) {
            const touch = event.touches[i];
            touchPoints[i].target.set(touch.clientX, height - touch.clientY);
            touchPoints[i].active = true;
          }
          if (touchCount >= 2) {
            const {width} = getSize();
            const firstTouch = event.touches[0];
            const secondTouch = event.touches[1];
            state.center.set(
              (firstTouch.clientX + secondTouch.clientX) / 2 / width,
              1.0 - (firstTouch.clientY + secondTouch.clientY) / 2 / height,
            );
          }
        }
      };

      const handleMouseDown = (event: MouseEvent) => {
        touchPoints[0].active = true;
        setTouchTarget(0, event.clientX, event.clientY);
      };
      const handleMouseMove = (event: MouseEvent) => {
        setTouchTarget(0, event.clientX, event.clientY);
      };
      const handleMouseUp = () => {
        touchPoints[0].active = false;
      };
      const handleTouchMove = (event: TouchEvent) => {
        handleTouch(event);
      };

      let isInView = true;
      const shouldAnimate = () => isInView && !document.hidden;

      const animate = (time: number) => {
        animationFrame = 0;
        if (!renderer || !material) return;

        material.uniforms.iTime.value = time * 0.001;
        material.uniforms.iZoom.value = 1.0;
        material.uniforms.iStretch.value = 0.0;
        material.uniforms.iCenter.value.lerp(state.center, 0.1);

        for (let i = 0; i < MAX_TOUCHES; i++) {
          touchPoints[i].current.lerp(touchPoints[i].target, 0.1742);
          const targetPressure = touchPoints[i].active ? 1.0 : 0.0;
          touchPoints[i].pressure +=
            (targetPressure - touchPoints[i].pressure) * 0.15;
          material.uniforms.iPressures.value[i] = touchPoints[i].pressure;
        }

        renderer.render(scene, camera);
        if (shouldAnimate()) {
          animationFrame = window.requestAnimationFrame(animate);
        }
      };

      const startAnimation = () => {
        if (!animationFrame && shouldAnimate()) {
          animationFrame = window.requestAnimationFrame(animate);
        }
      };
      const stopAnimation = () => {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      };
      const handleVisibilityChange = () => {
        if (document.hidden) stopAnimation();
        else startAnimation();
      };
      const visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          isInView = entry.isIntersecting;
          if (isInView) startAnimation();
          else stopAnimation();
        },
        {rootMargin: '25% 0px'},
      );

      resize();
      window.addEventListener('resize', resize);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      visibilityObserver.observe(container);
      container.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('touchstart', handleTouch, {passive: true});
      container.addEventListener('touchmove', handleTouchMove, {passive: true});
      container.addEventListener('touchend', handleTouch);
      container.addEventListener('touchcancel', handleTouch);
      startAnimation();

      return () => {
        stopAnimation();
        window.removeEventListener('resize', resize);
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        );
        visibilityObserver.disconnect();
        container.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('touchstart', handleTouch);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouch);
        container.removeEventListener('touchcancel', handleTouch);
        geometry.dispose();
        material?.dispose();
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    }

    let cleanup: (() => void) | undefined;
    void initShader().then(
      (cleanupShader) => {
        cleanup = cleanupShader;
        if (isDisposed) cleanup?.();
      },
      (error: unknown) => {
        console.error(error);
      },
    );

    return () => {
      isDisposed = true;
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    let animationFrame = 0;

    const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
    const updateReveal = () => {
      animationFrame = 0;
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const start = window.innerHeight * 0.92;
      const end = window.innerHeight * 0.74;
      const progress = clamp((start - rect.top) / (start - end));
      section.style.setProperty('--shader-reveal-opacity', String(progress));
    };

    const requestUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateReveal);
    };

    updateReveal();
    window.addEventListener('scroll', requestUpdate, {passive: true});
    window.addEventListener('resize', requestUpdate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="shader-section"
      aria-label="Black liquid glass study"
    >
      <div ref={containerRef} className="shader-section__canvas-wrap" />
    </section>
  );
}
