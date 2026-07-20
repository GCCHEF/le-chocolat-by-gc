import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import type {TextureProductsQuery} from 'storefrontapi.generated';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';

type TextureProduct =
  NonNullable<
    | TextureProductsQuery['cu1']
    | TextureProductsQuery['cu2']
    | TextureProductsQuery['cu3']
  >;

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

function getDetailPanels(title: string) {
  return [1, 2, 3].map((index) => ({
    index,
    title: `${title} ${index}`,
  }));
}

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

function TextureProductPanel({product}: {product: TextureProduct}) {
  const {open} = useAside();
  const variant = product.selectedOrFirstAvailableVariant;

  return (
    <article className="featured-work-detail__panel featured-work-detail__panel--product-slot">
      <div className="featured-work-detail__image featured-work-detail__product-image">
        {product.featuredImage ? (
          <Image
            data={product.featuredImage}
            sizes="(max-width: 720px) 88vw, 43vw"
          />
        ) : null}
      </div>
      <div className="featured-work-detail__product-copy">
        <h3>{product.title}</h3>
        <Money data={product.priceRange.minVariantPrice} />
        <AddToCartButton
          disabled={!variant?.availableForSale}
          lines={
            variant ? [{merchandiseId: variant.id, quantity: 1}] : []
          }
          onClick={() => open('cart')}
        >
          {variant?.availableForSale ? 'Add to basket' : 'Sold out'}
        </AddToCartButton>
      </div>
    </article>
  );
}

export default function FeaturedWork({
  products,
}: {
  products: TextureProduct[];
}) {
  const textureProducts = Array.isArray(products) ? products : [];
  const introRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const detailRef = useRef<HTMLElement | null>(null);
  const detailTrackRef = useRef<HTMLDivElement | null>(null);
  const detailProgressRef = useRef(0);
  const detailTargetScrollRef = useRef(0);
  const detailTouchYRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
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
    setIsDetailVisible(false);
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

    const revealFrame = window.requestAnimationFrame(() => {
      setIsDetailVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(revealFrame);
      setIsDetailVisible(false);
    };
  }, [activeWorkId]);

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

    const detail = detailRef.current;
    const track = detailTrackRef.current;
    if (!detail || !track) return;

    let animationFrame = 0;

    const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

    const getMaxScroll = () =>
      Math.max(0, track.scrollWidth - track.clientWidth);

    const applyScroll = (scrollLeft: number) => {
      const maxScroll = getMaxScroll();
      const progress = maxScroll > 0 ? clamp(scrollLeft / maxScroll) : 0;

      detail.style.setProperty(
        '--featured-detail-progress',
        String(progress),
      );
      detail.style.setProperty(
        '--featured-summary-opacity',
        String(1 - Math.min(progress / 0.32, 1)),
      );
      detail.style.setProperty(
        '--featured-summary-x',
        `${-progress * 64}px`,
      );
    };

    const animateTrack = () => {
      const nextScroll =
        track.scrollLeft +
        (detailTargetScrollRef.current - track.scrollLeft) * 0.18;
      track.scrollLeft = nextScroll;
      detailProgressRef.current = nextScroll;
      applyScroll(nextScroll);

      if (Math.abs(detailTargetScrollRef.current - nextScroll) > 0.5) {
        animationFrame = window.requestAnimationFrame(animateTrack);
        return;
      }

      track.scrollLeft = detailTargetScrollRef.current;
      detailProgressRef.current = detailTargetScrollRef.current;
      applyScroll(detailTargetScrollRef.current);
      animationFrame = 0;
    };

    const requestAnimation = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(animateTrack);
    };

    const moveProgress = (delta: number) => {
      const maxScroll = getMaxScroll();
      detailTargetScrollRef.current = Math.min(
        Math.max(detailTargetScrollRef.current + delta, 0),
        maxScroll,
      );
      requestAnimation();
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      moveProgress(delta);
    };

    const handleTouchStart = (event: TouchEvent) => {
      detailTouchYRef.current = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const nextY = event.touches[0]?.clientY ?? detailTouchYRef.current;
      const delta = detailTouchYRef.current - nextY;
      detailTouchYRef.current = nextY;
      event.preventDefault();
      moveProgress(delta * 2.2);
    };

    const handleResize = () => {
      detailTargetScrollRef.current = Math.min(
        detailTargetScrollRef.current,
        getMaxScroll(),
      );
      applyScroll(track.scrollLeft);
    };

    track.scrollLeft = 0;
    detailProgressRef.current = 0;
    detailTargetScrollRef.current = 0;
    applyScroll(0);
    window.addEventListener('wheel', handleWheel, {passive: false});
    window.addEventListener('touchstart', handleTouchStart, {passive: false});
    window.addEventListener('touchmove', handleTouchMove, {passive: false});
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
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
          ref={detailRef}
          className={`featured-work-detail ${
            isDetailVisible ? 'featured-work-detail--visible' : ''
          }`}
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
          <div className="featured-work-detail__viewport">
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
              <AnimatedText
                className="featured-work-detail__eyebrow"
                text={activeWork.eyebrow}
              />
              <AnimatedText
                className="featured-work-detail__title"
                offset={5}
                text={activeWork.title}
              />
              <span className="featured-work-detail__description">
                {activeWork.description}
              </span>
            </div>
            <div className="featured-work-detail__track" ref={detailTrackRef}>
              {activeWork.id === 'matiere-origin'
                ? [0, 1, 2].map((index) => {
                    const product = textureProducts[index];

                    return product ? (
                      <TextureProductPanel
                        key={product.id}
                        product={product}
                      />
                    ) : (
                      <article
                        className="featured-work-detail__panel featured-work-detail__panel--product-slot"
                        key={`texture-slot-${index}`}
                      >
                        <div className="featured-work-detail__image" />
                      </article>
                    );
                  })
                : getDetailPanels(activeWork.title).map((panel) => (
                    <article
                      className={`featured-work-detail__panel featured-work-detail__panel--product-slot ${activeWork.palette}`}
                      key={`${activeWork.id}-${panel.index}`}
                    >
                      <div className="featured-work-detail__image" />
                    </article>
                  ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
