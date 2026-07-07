import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';

const WORK_ITEMS = [
  {
    id: 'matiere-origin',
    eyebrow: 'Matiere / Origin',
    title: 'Texture',
    description: 'Single-origin cacao, interpreted through texture and shadow.',
    palette: 'featured-work-card--origin',
  },
  {
    id: 'bonbon-archive',
    eyebrow: 'Bonbons / Collection',
    title: 'Essentiel',
    description: 'A quiet study of form, filling, shell, and finish.',
    palette: 'featured-work-card--bonbon',
  },
  {
    id: 'noir-72',
    eyebrow: 'Tablettes / Noir',
    title: 'Origine',
    description: 'Dark chocolate as a minimal architectural object.',
    palette: 'featured-work-card--noir',
  },
  {
    id: 'atelier-cape-town',
    eyebrow: 'Atelier / Cape Town',
    title: 'Racine',
    description: 'Manufacture details, gestures, tools, and material memory.',
    palette: 'featured-work-card--atelier',
  },
];

function AnimatedText({
  className,
  offset = 0,
  text,
}: {
  className: string;
  offset?: number;
  text: string;
}) {
  return (
    <span
      className={`${className} featured-work-reveal`}
      aria-label={text}
      style={{'--featured-text-delay': `${offset * 42}ms`} as CSSProperties}
    >
      <span className="featured-work-reveal__mask">
        <span className="featured-work-reveal__line">{text}</span>
      </span>
    </span>
  );
}

export default function FeaturedWork() {
  const introRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const detailTrackRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const [detailOrigin, setDetailOrigin] = useState({
    height: 1,
    scaleX: 1,
    scaleY: 1,
    width: 1,
    x: 0,
    y: 0,
  });

  const activeWork = WORK_ITEMS.find((item) => item.id === activeWorkId);

  const openWork = (event: MouseEvent<HTMLButtonElement>, workId: string) => {
    const image = event.currentTarget.querySelector('.featured-work-card__image');
    const rect = image?.getBoundingClientRect();

    if (rect) {
      setDetailOrigin({
        height: rect.height,
        scaleX: rect.width / window.innerWidth,
        scaleY: rect.height / window.innerHeight,
        width: rect.width,
        x: rect.left,
        y: rect.top,
      });
    }

    setActiveWorkId(workId);
  };

  useEffect(() => {
    const intro = introRef.current;
    if (!intro) return;

    let lastScrollY = window.scrollY;
    let isScrollingDown = true;

    const updateDirection = () => {
      const nextScrollY = window.scrollY;
      isScrollingDown = nextScrollY >= lastScrollY;
      lastScrollY = nextScrollY;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && isScrollingDown) {
          setIsVisible(true);
        }

        if (!entry.isIntersecting && entry.boundingClientRect.top > 0) {
          setIsVisible(false);
        }
      },
      {rootMargin: '-6% 0px -12%', threshold: 0.16},
    );

    window.addEventListener('scroll', updateDirection, {passive: true});
    observer.observe(intro);

    return () => {
      window.removeEventListener('scroll', updateDirection);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.featured-work-card'));
    let lastScrollY = window.scrollY;
    let isScrollingDown = true;

    const updateDirection = () => {
      const nextScrollY = window.scrollY;
      isScrollingDown = nextScrollY >= lastScrollY;
      lastScrollY = nextScrollY;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && isScrollingDown) {
            entry.target.classList.add('featured-work-card--revealed');
          }

          if (!entry.isIntersecting && entry.boundingClientRect.top > 0) {
            entry.target.classList.remove('featured-work-card--revealed');
          }
        });
      },
      {rootMargin: '0px 0px -8% 0px', threshold: 0.08},
    );

    window.addEventListener('scroll', updateDirection, {passive: true});
    cards.forEach((card) => observer.observe(card));

    return () => {
      window.removeEventListener('scroll', updateDirection);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!activeWorkId) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeWorkId]);

  useEffect(() => {
    if (!activeWorkId) return;

    const track = detailTrackRef.current;
    if (!track) return;

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      track.scrollLeft += event.deltaY;
    };

    track.addEventListener('wheel', handleWheel, {passive: false});

    return () => {
      track.removeEventListener('wheel', handleWheel);
    };
  }, [activeWorkId]);

  return (
    <>
      <section
        className={`featured-work ${isVisible ? 'featured-work--visible' : ''}`}
        aria-label="Featured work"
      >
        <div className="featured-work__intro" ref={introRef}>
          <AnimatedText className="featured-work__label" text="Creation" />
        </div>
        <div className="featured-work__grid" ref={gridRef}>
          {WORK_ITEMS.map((item, index) => (
            <button
              className={`featured-work-card ${item.palette}`}
              key={item.id}
              onClick={(event) => openWork(event, item.id)}
              style={{'--featured-work-index': index} as CSSProperties}
              type="button"
            >
              <span className="featured-work-card__image" aria-hidden="true">
                <span className="featured-work-card__image-core" />
              </span>
              <span className="featured-work-card__copy">
                <AnimatedText
                  className="featured-work-card__meta"
                  text={item.eyebrow}
                />
                <span className="featured-work-card__title-row">
                  <AnimatedText
                    className="featured-work-card__title"
                    offset={8}
                    text={item.title}
                  />
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {activeWork ? (
        <section
          className="featured-work-detail"
          aria-label={`${activeWork.title} detail`}
          style={
            {
              '--featured-origin-height': `${detailOrigin.height}px`,
              '--featured-origin-scale-x': detailOrigin.scaleX,
              '--featured-origin-scale-y': detailOrigin.scaleY,
              '--featured-origin-width': `${detailOrigin.width}px`,
              '--featured-origin-x': `${detailOrigin.x}px`,
              '--featured-origin-y': `${detailOrigin.y}px`,
            } as CSSProperties
          }
        >
          <div className="featured-work-detail__hero" aria-hidden="true">
            <div
              className={`featured-work-detail__hero-image ${activeWork.palette}`}
            />
          </div>
          <button
            className="featured-work-detail__close"
            onClick={() => setActiveWorkId(null)}
            type="button"
          >
            Close
          </button>
          <div className="featured-work-detail__summary">
            <p>{activeWork.eyebrow}</p>
            <h2>{activeWork.title}</h2>
            <span>{activeWork.description}</span>
          </div>
          <div className="featured-work-detail__track" ref={detailTrackRef}>
            {[0, 1, 2, 3].map((panel) => (
              <article
                className={`featured-work-detail__panel ${activeWork.palette}`}
                key={`${activeWork.id}-${panel}`}
              >
                <div className="featured-work-detail__image" />
                <p>{String(panel + 1).padStart(2, '0')}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
