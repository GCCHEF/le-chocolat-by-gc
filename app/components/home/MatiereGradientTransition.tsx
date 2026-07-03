import {useEffect, useRef} from 'react';
import ShaderEntry from './ShaderEntry';

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function easeInOutCubic(value: number) {
  const progress = clamp(value);

  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

export default function MatiereGradientTransition() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let animationFrame = 0;

    const updateProgress = () => {
      animationFrame = 0;
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollableDistance = Math.max(1, rect.height - window.innerHeight);
      const rawProgress = clamp(-rect.top / scrollableDistance);
      const shaderProgress = clamp(rawProgress);
      const matiereProgress = clamp((rawProgress - 0.45) / 0.5);
      const chocolatProgress = clamp((rawProgress - 0.72) / 0.35);
      const matiereEase = easeInOutCubic(matiereProgress);
      const chocolatEase = easeInOutCubic(chocolatProgress);
      const titleShift = matiereEase * 80;
      const subtitleShift = chocolatEase * 160;
      const titleOpacity = 1 - clamp((matiereProgress - 0.34) / 0.62);
      const subtitleOpacity =
        clamp(chocolatProgress / 0.34) *
        (1 - clamp((chocolatProgress - 0.86) / 0.14));

      section.style.setProperty('--matiere-title-shift', `${titleShift}px`);
      section.style.setProperty(
        '--matiere-subtitle-shift',
        `${subtitleShift}px`,
      );
      section.style.setProperty('--matiere-title-opacity', String(titleOpacity));
      section.style.setProperty(
        '--matiere-subtitle-opacity',
        String(subtitleOpacity),
      );
      document.documentElement.style.setProperty(
        '--shader-entry-lift',
        String(shaderProgress * 12),
      );
    };

    const requestUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', requestUpdate, {passive: true});
    window.addEventListener('resize', requestUpdate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      document.documentElement.style.removeProperty('--shader-entry-lift');
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="matiere-master-scene"
      aria-label="Matiere transition"
    >
      <div className="text-overlay-layer">
        <div className="matiere-title">
          <p className="chocolat-title">LE CHOCOLAT BY GC</p>
          <h1>MATIÈRE</h1>
        </div>
      </div>
      <div className="shader-gradient-layer">
        <ShaderEntry />
      </div>
    </section>
  );
}
