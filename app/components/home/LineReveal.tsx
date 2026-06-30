import {useEffect, useRef, useState} from 'react';

export default function LineReveal() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const easeInOut = (value: number) =>
      value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;

    const updateProgress = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const scrollable = Math.max(rect.height - window.innerHeight, 1);
      const rawProgress = Math.min(
        Math.max((window.innerHeight - rect.top) / scrollable, 0),
        1,
      );
      const nextProgress = easeInOut(rawProgress);

      setProgress(nextProgress);
    };
    const requestProgressUpdate = () => {
      if (rafRef.current) return;

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = 0;
        updateProgress();
      });
    };

    updateProgress();
    window.addEventListener('scroll', requestProgressUpdate, {passive: true});
    window.addEventListener('resize', requestProgressUpdate);

    return () => {
      window.removeEventListener('scroll', requestProgressUpdate);
      window.removeEventListener('resize', requestProgressUpdate);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`line-reveal ${
        progress > 0.92 ? 'line-reveal--filled' : ''
      }`}
      aria-label="Cinematic line reveal"
      style={{'--line-progress': progress} as React.CSSProperties}
    >
      <div className="line-reveal__sticky">
        <div className="loading-intro__line-wrap line-reveal__line-wrap">
          <span
            className="loading-intro__line line-reveal__line"
            style={{'--intro-progress': 1} as React.CSSProperties}
          >
            <span className="loading-intro__beam loading-intro__beam--bloom line-reveal__beam" />
            <span className="loading-intro__beam loading-intro__beam--medium-glow line-reveal__beam" />
            <span className="loading-intro__beam loading-intro__beam--optical-core line-reveal__beam" />
          </span>
        </div>
        <div className="line-reveal__wash" />
      </div>
    </section>
  );
}
