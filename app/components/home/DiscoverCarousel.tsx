import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from 'react';
import {Image} from '@shopify/hydrogen';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';

type DiscoverProduct = RecommendedProductsQuery['products']['nodes'][number];

function getProductCode(title: string) {
  return title.trim().toUpperCase().replace(/\s+/g, '');
}

function getPrefix(title: string) {
  return getProductCode(title).match(/^[A-Z]+/)?.[0] ?? '';
}

function getFamilyMark(title: string) {
  const prefix = getPrefix(title);
  return prefix === 'PR' ? 'PRA' : prefix;
}

function getCreationCategory(title: string) {
  const prefix = getPrefix(title);
  if (prefix === 'CU') return 'matiere-origin';
  if (prefix === 'AS') return 'bonbon-archive';
  if (prefix === 'NU' || prefix === 'CO') return 'noir-72';
  return 'atelier-cape-town';
}

export default function DiscoverCarousel({
  products,
}: {
  products: DiscoverProduct[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'previous'>('next');
  const [isVisible, setIsVisible] = useState(false);
  const carouselRef = useRef<HTMLElement | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const didSwipeRef = useRef(false);
  const wheelLockedRef = useRef(false);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      {rootMargin: '-6% 0px -12%', threshold: 0.16},
    );

    observer.observe(carousel);
    return () => observer.disconnect();
  }, []);

  if (!products.length) return null;

  const slides = [
    ...products.map((product) => ({
      ...product,
      localImage: undefined as string | undefined,
      shopPath: undefined as string | undefined,
    })),
    {
      id: 'discover-cobbles',
      title: 'CO01',
      featuredImage: null,
      localImage: '/images/discover-co-dsc03314-2.jpg',
      shopPath: undefined,
    },
  ];

  const select = (index: number, nextDirection: 'next' | 'previous') => {
    setDirection(nextDirection);
    setActiveIndex((index + slides.length) % slides.length);
  };
  const previous = () => select(activeIndex - 1, 'previous');
  const next = () => select(activeIndex + 1, 'next');
  const activeProduct = slides[activeIndex];

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    didSwipeRef.current = false;
    pointerStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (pointerStartX.current == null) return;
    const distance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(distance) < 45) return;
    didSwipeRef.current = true;
    event.preventDefault();
    if (distance < 0) next();
    else previous();
  };

  const handleWheel = (event: WheelEvent<HTMLButtonElement>) => {
    if (
      Math.abs(event.deltaX) <= Math.abs(event.deltaY) ||
      wheelLockedRef.current
    ) {
      return;
    }
    event.preventDefault();
    wheelLockedRef.current = true;
    if (event.deltaX > 0) next();
    else previous();
    window.setTimeout(() => {
      wheelLockedRef.current = false;
    }, 520);
  };

  const openCreationCategory = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }

    if (activeProduct.shopPath) {
      window.location.assign(activeProduct.shopPath);
      return;
    }

    window.dispatchEvent(
      new CustomEvent('open-creation-category', {
        detail: {
          source: 'discovery',
          workId: getCreationCategory(activeProduct.title),
        },
      }),
    );
    document.getElementById('creation')?.scrollIntoView({block: 'start'});
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured products"
      className={`discover-carousel discover-carousel--${direction} ${
        isVisible ? 'discover-carousel--visible' : ''
      }`}
      ref={carouselRef}
    >
      <button
        aria-label={`Open the Creation category for ${activeProduct.title}`}
        className={`discover-carousel__stage discover-carousel__stage--${getProductCode(
          activeProduct.title,
        ).toLowerCase()}`}
        key={`image-${activeProduct.id}`}
        onClick={openCreationCategory}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        type="button"
      >
        {activeProduct.localImage ? (
          <img alt="Cobbles chocolate assortment" src={activeProduct.localImage} />
        ) : getProductCode(activeProduct.title) === 'CU01' ? (
          <img
            alt="Cubes chocolate assortment"
            src="/images/discover-cu-dsc03050.jpg"
          />
        ) : getProductCode(activeProduct.title) === 'AS02' ? (
          <img
            alt="Essentiel chocolate assortment"
            src="/images/discover-as02-dsc03592-2.jpg"
          />
        ) : activeProduct.featuredImage ? (
          <Image
            alt={activeProduct.featuredImage.altText || activeProduct.title}
            data={activeProduct.featuredImage}
            loading="lazy"
            sizes="100vw"
          />
        ) : null}
      </button>

      <div className="discover-carousel__shade" aria-hidden="true" />
      <span
        aria-label="Discover"
        className="featured-work__label featured-work-reveal discover-carousel__eyebrow"
      >
        <span className="featured-work-reveal__mask">
          <span className="featured-work-reveal__line">Discover</span>
        </span>
      </span>
      <div
        className={`discover-carousel__overlay discover-carousel__overlay--${getProductCode(
          activeProduct.title,
        ).toLowerCase()}`}
        key={activeProduct.id}
      >
        <div className="discover-carousel__mark-mask">
          <strong
            aria-label={getFamilyMark(activeProduct.title)}
            className="discover-carousel__mark"
          >
            {Array.from(getFamilyMark(activeProduct.title)).map(
              (letter, index) => (
                <span aria-hidden="true" key={`${letter}-${index}`}>
                  {letter}
                </span>
              ),
            )}
          </strong>
        </div>
      </div>

      <div className="discover-carousel__controls" aria-label="Choose product">
        {slides.map((product, index) => (
          <button
            aria-current={index === activeIndex ? 'true' : undefined}
            aria-label={`Show ${product.title}`}
            key={product.id}
            onClick={() =>
              select(index, index >= activeIndex ? 'next' : 'previous')
            }
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
