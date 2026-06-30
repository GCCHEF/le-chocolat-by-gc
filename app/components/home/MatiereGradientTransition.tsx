import {useEffect, useRef} from 'react';

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 1);
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
      const headerHeight =
        parseFloat(
          window
            .getComputedStyle(document.documentElement)
            .getPropertyValue('--header-height'),
        ) || 0;
      const scrollableDistance = Math.max(
        1,
        rect.height - (window.innerHeight - headerHeight),
      );
      const progress = clamp((headerHeight - rect.top) / scrollableDistance);
      const coverOffset = 100 - progress * 100;

      section.style.setProperty('--gradient-cover-offset', `${coverOffset}%`);
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
  }, []);

  return (
    <section
      ref={sectionRef}
      className="matiere-scene"
      aria-label="Matiere transition"
    >
      <div className="matiere-sticky">
        <div className="matiere-title">
          <h1>MATIÈRE</h1>
          <p>LE CHOCOLAT BY GC</p>
        </div>
        <div className="gradient-cover" />
      </div>
    </section>
  );
}
