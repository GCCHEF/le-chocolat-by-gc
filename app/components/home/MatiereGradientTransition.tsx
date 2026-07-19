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
      const shaderProgress = clamp((rawProgress - 0.064) / 0.936);
      const numberProgress = clamp(rawProgress / 0.42);
      const wordProgress = clamp((rawProgress - 0.035) / 0.61);
      const chocolatProgress = clamp((rawProgress - 0.32) / 0.4);
      const numberEase = easeInOutCubic(numberProgress);
      const wordEase = easeInOutCubic(wordProgress);
      const chocolatEase = easeInOutCubic(chocolatProgress);
      const numberShift = numberEase * Math.max(260, window.innerHeight * 0.36);
      const titleShift = wordEase * Math.max(255, window.innerHeight * 0.36);
      const subtitleShift = 0;
      const titleOpacity = 1 - clamp((rawProgress - 0.24) / 0.14);
      const definitionOpacity = 1 - clamp((rawProgress - 0.1) / 0.18);
      const numberOpacity = 1 - clamp((rawProgress - 0.1) / 0.2);
      const lineOpacity = 1 - clamp((rawProgress - 0.08) / 0.26);
      const cornerMatterOpacity =
        clamp(rawProgress / 0.2) *
        (1 - clamp((rawProgress - 0.16) / 0.14));
      const cornerCellAOpacity = easeInOutCubic(clamp(rawProgress / 0.11));
      const cornerCellBOpacity = easeInOutCubic(
        clamp((rawProgress - 0.028) / 0.17),
      );
      const cornerCellCOpacity = easeInOutCubic(
        clamp((rawProgress - 0.074) / 0.12),
      );
      const cornerCellDOpacity = easeInOutCubic(
        clamp((rawProgress - 0.118) / 0.19),
      );
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
      section.style.setProperty(
        '--matiere-corner-matter-opacity',
        String(cornerMatterOpacity),
      );
      section.style.setProperty(
        '--matiere-corner-cell-a-opacity',
        String(cornerCellAOpacity),
      );
      section.style.setProperty(
        '--matiere-corner-cell-b-opacity',
        String(cornerCellBOpacity),
      );
      section.style.setProperty(
        '--matiere-corner-cell-c-opacity',
        String(cornerCellCOpacity),
      );
      section.style.setProperty(
        '--matiere-corner-cell-d-opacity',
        String(cornerCellDOpacity),
      );
      section.style.setProperty('--matiere-title-opacity', String(titleOpacity));
      section.style.setProperty(
        '--matiere-definition-opacity',
        String(definitionOpacity),
      );
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
      <div className="matiere-droplet-overlay">
        <div className="matiere-corner-matter" aria-hidden="true">
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--one" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--two" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--three" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--four" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--five" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--six" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--seven" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--eight" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--nine" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--ten" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--eleven" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--twelve" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--thirteen" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--fourteen" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--fifteen" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--sixteen" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--seventeen" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--eighteen" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--nineteen" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--twenty" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--twenty-one" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--twenty-two" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--twenty-three" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--twenty-four" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--twenty-five" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--twenty-six" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--twenty-seven" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--twenty-eight" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--twenty-nine" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--thirty" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--thirty-one" />
          <span className="matiere-corner-matter__cell matiere-corner-matter__cell--thirty-two" />
        </div>
        <span
          className="matiere-corner-satellite matiere-corner-satellite--one"
          aria-hidden="true"
        />
        <span
          className="matiere-corner-satellite matiere-corner-satellite--two"
          aria-hidden="true"
        />
      </div>
      <div className="text-overlay-layer">
        <div className="matiere-composition-line" aria-hidden="true" />
        <p className="matiere-number">001</p>
        <div className="matiere-title">
          <h1>
            MATI<span className="matiere-title__accent">È</span>RE
          </h1>
          <p className="matiere-definition">
            (<span className="matiere-definition__latin">latin materia</span>)
            — The physical substance from which something is made; material
            considered for its texture, character, and expressive qualities.
          </p>
        </div>
        <p className="chocolat-title">MANUFACTURED IN CAPE TOWN</p>
      </div>
    </section>
  );
}
