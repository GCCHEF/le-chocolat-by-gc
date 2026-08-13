import {useEffect, useRef, useState} from 'react';

export default function MatiereReveal() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {threshold: 0.64},
    );

    observer.observe(sectionRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`matiere-reveal ${isVisible ? 'matiere-reveal--visible' : ''}`}
      aria-labelledby="matiere-title"
    >
      <div className="matiere-reveal__inner">
        <h1 id="matiere-title">MATIÈRE</h1>
        <p>LE CHOCOLAT</p>
      </div>
    </section>
  );
}
