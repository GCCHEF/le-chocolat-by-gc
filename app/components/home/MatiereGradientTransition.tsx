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
      const numberProgress = clamp(rawProgress / 0.6);
      const wordProgress = clamp((rawProgress - 0.035) / 0.61);
      const chocolatProgress = clamp((rawProgress - 0.32) / 0.4);
      const numberEase = easeInOutCubic(numberProgress);
      const wordEase = easeInOutCubic(wordProgress);
      const chocolatEase = easeInOutCubic(chocolatProgress);
      const numberShift = numberEase * Math.max(260, window.innerHeight * 0.36);
      const titleShift = wordEase * Math.max(205, window.innerHeight * 0.29);
      const subtitleShift = 0;
      const titleOpacity = 1 - clamp((rawProgress - 0.24) / 0.36);
      const numberOpacity = 1 - clamp((rawProgress - 0.14) / 0.32);
      const lineOpacity = 1 - clamp((rawProgress - 0.08) / 0.26);
      const subtitleOpacity =
        clamp(chocolatProgress / 0.18) *
        (1 - clamp((chocolatEase - 0.55) / 0.2));

      section.style.setProperty('--matiere-title-shift', `${titleShift}px`);
      section.style.setProperty('--matiere-number-shift', `${numberShift}px`);
      section.style.setProperty('--shader-entry-progress', String(shaderProgress));
      section.style.setProperty(
        '--matiere-subtitle-shift',
        `${subtitleShift}px`,
      );
      section.style.setProperty(
        '--matiere-line-opacity',
        String(lineOpacity),
      );
      section.style.setProperty('--matiere-title-opacity', String(titleOpacity));
      section.style.setProperty(
        '--matiere-number-opacity',
        String(numberOpacity),
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
        <div className="matiere-composition-line" aria-hidden="true" />
        <p className="matiere-number">001</p>
        <div className="matiere-title">
          <h1>
            MATI<span className="matiere-title__accent">È</span>RE
          </h1>
          <p className="matiere-definition">
            (latin materia) — The physical substance from which something is
            made; material considered for its texture, character, and expressive
            qualities.
          </p>
        </div>
        <p className="chocolat-title">MANUFACTURED IN CAPE TOWN</p>
      </div>
    </section>
  );
}
