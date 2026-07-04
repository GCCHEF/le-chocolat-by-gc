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

export default function MatiereGradientTransition({
  isTitleRevealActive = false,
  isTitleVisible = true,
}: {
  isTitleRevealActive?: boolean;
  isTitleVisible?: boolean;
}) {
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
      const shaderProgress = clamp((rawProgress - 0.064) / 0.72);
      const matiereProgress = clamp(rawProgress / 0.565);
      const matiereMovementProgress =
        rawProgress > 0 ? clamp((rawProgress + 0.035) / 0.565) : 0;
      const chocolatProgress = clamp((rawProgress - 0.32) / 0.4);
      const matiereEase = easeInOutCubic(matiereMovementProgress);
      const chocolatEase = easeInOutCubic(chocolatProgress);
      const titleShift = matiereEase * Math.max(240, window.innerHeight * 0.34);
      const collectionShift = matiereEase * Math.max(72, window.innerHeight * 0.102);
      const subtitleShift = chocolatEase * Math.max(192, window.innerHeight * 0.248);
      const titleOpacity = 1 - clamp((matiereProgress - 0.24) / 0.52);
      const collectionOpacity =
        isTitleVisible && !isTitleRevealActive
          ? clamp(matiereProgress / 0.045) *
            (1 - clamp((matiereProgress - 0.11) / 0.09))
          : 0;
      const subtitleOpacity =
        clamp(chocolatProgress / 0.18) *
        (1 - clamp((chocolatEase - 0.3) / 0.2));

      section.style.setProperty('--matiere-title-shift', `${titleShift}px`);
      section.style.setProperty('--shader-entry-progress', String(shaderProgress));
      section.style.setProperty(
        '--matiere-subtitle-shift',
        `${subtitleShift}px`,
      );
      section.style.setProperty(
        '--matiere-collection-shift',
        `${collectionShift}px`,
      );
      section.style.setProperty('--matiere-title-opacity', String(titleOpacity));
      section.style.setProperty(
        '--matiere-collection-opacity',
        String(collectionOpacity),
      );
      section.style.setProperty(
        '--matiere-subtitle-opacity',
        String(subtitleOpacity),
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
    };
  }, [isTitleRevealActive, isTitleVisible]);

  const sceneClassName = [
    'matiere-master-scene',
    isTitleRevealActive ? 'matiere-master-scene--title-reveal' : '',
    isTitleVisible ? '' : 'matiere-master-scene--title-pending',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      ref={sectionRef}
      className={sceneClassName}
      aria-label="Matiere transition"
    >
      <div className="shader-gradient-layer" aria-hidden="true">
        <ShaderEntry />
      </div>
      <div className="text-overlay-layer">
        <div className="matiere-title">
          <h1>
            MATI<span className="matiere-title__accent">È</span>RE
          </h1>
        </div>
        <p className="matiere-collection-label">COLLECTION 001 / 2026</p>
        <p className="chocolat-title">LE CHOCOLAT BY GC</p>
      </div>
    </section>
  );
}
