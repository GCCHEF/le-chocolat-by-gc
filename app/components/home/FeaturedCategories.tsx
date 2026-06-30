import {useEffect, useRef, useState} from 'react';

const CATEGORIES = ['BONBONS', 'TABLETTES', 'COFFRETS'];

export default function FeaturedCategories() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {threshold: 0.25},
    );

    observer.observe(sectionRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`featured-categories ${
        isVisible ? 'featured-categories--visible' : ''
      }`}
      aria-label="Featured categories"
    >
      <div className="featured-categories__track">
        {CATEGORIES.map((category) => (
          <article className="featured-categories__card" key={category}>
            <span>{category}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
