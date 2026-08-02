import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import {Image} from '@shopify/hydrogen';
import type {CategoryProductsQuery} from 'storefrontapi.generated';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import AsciiImage from './AsciiImage';

type CategoryProduct = NonNullable<
  CategoryProductsQuery[keyof CategoryProductsQuery]
>;

type CategoryProducts = Record<string, CategoryProduct[]>;

type TextureProduct = NonNullable<
  | CategoryProductsQuery['cu1']
  | CategoryProductsQuery['cu2']
  | CategoryProductsQuery['cu3']
>;

const WORK_ITEMS = [
  {
    id: 'matiere-origin',
    eyebrow: 'Matiere / Cubes',
    detailEyebrow: 'Matiere / Texture',
    thumbnail: '/images/texture-category.jpg',
    title: 'Texture',
    description:
      'Almond and hazelnut praliné with single-origin 64% Madagascar chocolate, toasted almonds, coated in dark chocolate.',
    palette: 'featured-work-card--origin',
  },
  {
    id: 'bonbon-archive',
    eyebrow: 'Matiere / Assortment',
    detailEyebrow: 'Matiere / Essentiel',
    detailTitle: 'Assortment',
    thumbnail: '/images/essentiel-category-portrait.jpg',
    title: 'Essentiel',
    description:
      'CU(bes) hazelnut and almond praliné, 64% Grand Cru chocolate, toasted almonds, coated in dark chocolate.',
    secondaryDescription:
      '70% Guanaja ganache, coated in dark chocolate.',
    tertiaryDescription:
      'Cassis and Poivre de Cassis half sphere, dark chocolate shell.',
    quaternaryDescription:
      'Almond Parmesan praliné, coated in dark chocolate.',
    palette: 'featured-work-card--bonbon',
  },
  {
    id: 'noir-72',
    eyebrow: 'Matiere / Nuances / Cobbles',
    detailEyebrow: 'Matiere / Origine',
    thumbnail: '/images/origine-category.jpg',
    title: 'Origine',
    description:
      'Flavor initiation with nine Grand Cru and blend chocolate ganache ranging from 33 to 85% cocoa content.',
    palette: 'featured-work-card--noir',
  },
  {
    id: 'atelier-cape-town',
    eyebrow: 'Matiere / Praliné / Truffles',
    detailEyebrow: 'Matiere / Racines',
    thumbnail: '/images/racines-category.jpg',
    title: 'Racines',
    description:
      'Hazelnut and almond praliné, presented in four distinct flavors: buckwheat, cocoa nibs, Parmesan and feuilletine.',
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

function CubesTitle() {
  return (
    <span
      className="featured-work-detail__title featured-work-detail__title--cubes featured-work-reveal"
      aria-label="Cubes"
      style={{'--featured-text-delay': `${5 * 42}ms`} as CSSProperties}
    >
      <span className="featured-work-reveal__mask">
        <span className="featured-work-reveal__line">
          <span className="featured-work-detail__title-cubes-prefix">CU</span>
          <span className="featured-work-detail__title-cubes-suffix">
            <span className="featured-work-detail__title-cubes-paren">(</span>
            bes
            <span className="featured-work-detail__title-cubes-paren">)</span>
          </span>
        </span>
      </span>
    </span>
  );
}

function AssortmentTitle() {
  return (
    <span
      className="featured-work-detail__title featured-work-detail__title--assortment featured-work-reveal"
      aria-label="Assortment"
      style={{'--featured-text-delay': `${5 * 42}ms`} as CSSProperties}
    >
      <span className="featured-work-reveal__mask">
        <span className="featured-work-reveal__line">
          <span>AS</span>
          <span className="featured-work-detail__title-cubes-suffix">
            <span className="featured-work-detail__title-cubes-paren">(</span>
            sortment
            <span className="featured-work-detail__title-cubes-paren">)</span>
          </span>
        </span>
      </span>
    </span>
  );
}

function NuancesTitle() {
  return (
    <span
      className="featured-work-detail__title featured-work-detail__title--nuances featured-work-reveal"
      aria-label="Nuances"
      style={{'--featured-text-delay': `${5 * 42}ms`} as CSSProperties}
    >
      <span className="featured-work-reveal__mask">
        <span className="featured-work-reveal__line">
          <span>NU</span>
          <span className="featured-work-detail__title-cubes-suffix">
            <span className="featured-work-detail__title-cubes-paren">(</span>
            ances
            <span className="featured-work-detail__title-cubes-paren">)</span>
          </span>
        </span>
      </span>
    </span>
  );
}

function CobblesTitle() {
  return (
    <span
      className="featured-work-detail__title featured-work-detail__title--cobbles featured-work-detail__cobbles-title featured-work-reveal"
      aria-label="Cobbles"
    >
      <span className="featured-work-reveal__mask">
        <span className="featured-work-reveal__line">
          <span>CO</span>
          <span className="featured-work-detail__title-cubes-suffix">
            <span className="featured-work-detail__title-cubes-paren">(</span>
            bbles
            <span className="featured-work-detail__title-cubes-paren">)</span>
          </span>
        </span>
      </span>
    </span>
  );
}

function PralineTitle() {
  return (
    <span
      className="featured-work-detail__title featured-work-detail__title--praline featured-work-reveal"
      aria-label="Praliné"
      style={{'--featured-text-delay': `${5 * 42}ms`} as CSSProperties}
    >
      <span className="featured-work-reveal__mask">
        <span className="featured-work-reveal__line">
          <span>PRA</span>
          <span className="featured-work-detail__title-cubes-suffix">
            <span className="featured-work-detail__title-cubes-paren">(</span>
            liné
            <span className="featured-work-detail__title-cubes-paren">)</span>
          </span>
        </span>
      </span>
    </span>
  );
}

function formatCubeTitle(title: string) {
  const match = title.match(/^CU\s*0*(\d+)$/i);
  if (!match) return title;

  return `CU${match[1].padStart(2, '0')}`;
}

function formatCategoryProductTitle(title: string) {
  const match = title.match(/^(AS|OR|CO|PR)\s*0*(\d+)$/i);
  if (!match) return title;

  const prefix = match[1].toUpperCase();

  return `${prefix}${match[2].padStart(2, '0')}`;
}

function ProductPanel({
  product,
  title,
}: {
  product: CategoryProduct;
  title: string;
}) {
  const {open} = useAside();
  const variant = product.selectedOrFirstAvailableVariant;

  return (
    <article
      className={`featured-work-detail__panel featured-work-detail__panel--product-slot ${
        ['CU03', 'AS03', 'PR03'].includes(title)
          ? 'featured-work-detail__panel--cu003'
          : ''
      }`}
    >
      <div className="featured-work-detail__image featured-work-detail__product-image">
        {product.featuredImage ? (
          <Image
            data={product.featuredImage}
            sizes="(max-width: 720px) 88vw, 43vw"
          />
        ) : null}
      </div>
      <div className="featured-work-detail__product-copy">
        <h3>{title}</h3>
        <span className="featured-work-detail__product-price">
          R {Number(product.priceRange.minVariantPrice.amount).toFixed(2)}
        </span>
        <AddToCartButton
          disabled={!variant?.availableForSale}
          lines={
            variant
              ? [
                  {
                    merchandiseId: variant.id,
                    quantity: 1,
                    selectedVariant: variant,
                  },
                ]
              : []
          }
          onClick={() => open('cart')}
        >
          {variant?.availableForSale ? 'Add to basket' : 'Sold out'}
        </AddToCartButton>
      </div>
    </article>
  );
}

function TextureProductPanel({product}: {product: TextureProduct}) {
  return <ProductPanel product={product} title={formatCubeTitle(product.title)} />;
}

function CategoryProductPanel({product}: {product: CategoryProduct}) {
  return (
    <ProductPanel
      product={product}
      title={formatCategoryProductTitle(product.title)}
    />
  );
}

export default function FeaturedWork({
  categoryProducts,
  textureProducts,
}: {
  categoryProducts: CategoryProducts;
  textureProducts: TextureProduct[];
}) {
  const productsByCategory = categoryProducts ?? {};
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
  const [isMoreInformationVisible, setIsMoreInformationVisible] =
    useState(false);
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
    const openCategory = (event: Event) => {
      const workId = (event as CustomEvent<{workId?: string}>).detail?.workId;
      if (!workId || !WORK_ITEMS.some((item) => item.id === workId)) return;

      const card = gridRef.current?.querySelector<HTMLElement>(
        `[data-work-id="${workId}"] .featured-work-card__image`,
      );
      const rect = card?.getBoundingClientRect();

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

    window.addEventListener('open-creation-category', openCategory);
    return () =>
      window.removeEventListener('open-creation-category', openCategory);
  }, []);

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

    setIsMoreInformationVisible(false);
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
    document.body.classList.add('featured-work-detail-open');

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('featured-work-detail-open');
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
        id="creation"
      >
        <div className="featured-work__intro" ref={introRef}>
          <AnimatedText className="featured-work__label" text="Creation" />
        </div>
        <div className="featured-work__grid" ref={gridRef}>
          {WORK_ITEMS.map((item, index) => (
            <button
              className={`featured-work-card ${item.palette}`}
              data-work-id={item.id}
              key={item.id}
              onClick={(event) => openWork(event, item.id)}
              style={{'--featured-work-index': index} as CSSProperties}
              type="button"
            >
              <span
                className={`featured-work-card__image ${
                  'thumbnail' in item && typeof item.thumbnail === 'string'
                    ? 'featured-work-card__image--photo'
                    : ''
                }`}
                aria-hidden="true"
              >
                <span
                  className="featured-work-card__image-core"
                  style={
                    'thumbnail' in item && typeof item.thumbnail === 'string'
                      ? {
                          backgroundImage: `url(${item.thumbnail})`,
                          backgroundPosition: 'center',
                          backgroundSize:
                            item.id === 'bonbon-archive'
                              ? '115% auto'
                              : 'cover',
                        }
                      : undefined
                  }
                />
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
          } featured-work-detail--${activeWork.id}`}
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
                text={activeWork.detailEyebrow}
              />
              {activeWork.id === 'matiere-origin' ? (
                <CubesTitle />
              ) : activeWork.id === 'bonbon-archive' ? (
                <AssortmentTitle />
              ) : activeWork.id === 'noir-72' ? (
                <NuancesTitle />
              ) : activeWork.id === 'atelier-cape-town' ? (
                <PralineTitle />
              ) : (
                <AnimatedText
                  className={`featured-work-detail__title ${
                    'detailTitle' in activeWork &&
                    activeWork.detailTitle === 'Assortment'
                      ? 'featured-work-detail__title--assortment'
                      : ''
                  }`}
                  offset={5}
                  text={
                    'detailTitle' in activeWork &&
                    typeof activeWork.detailTitle === 'string'
                      ? activeWork.detailTitle
                      : activeWork.title
                  }
                />
              )}
              <span className="featured-work-detail__description">
                {activeWork.description}
                {'secondaryDescription' in activeWork &&
                typeof activeWork.secondaryDescription === 'string' ? (
                  <span className="featured-work-detail__description-line">
                    {activeWork.secondaryDescription}
                  </span>
                ) : null}
                {'tertiaryDescription' in activeWork &&
                typeof activeWork.tertiaryDescription === 'string' ? (
                  <span className="featured-work-detail__description-line">
                    {activeWork.tertiaryDescription}
                  </span>
                ) : null}
                {'quaternaryDescription' in activeWork &&
                typeof activeWork.quaternaryDescription === 'string' ? (
                  <span className="featured-work-detail__description-line">
                    {activeWork.quaternaryDescription}
                  </span>
                ) : null}
              </span>
              {activeWork.id === 'noir-72' ? (
                <div className="featured-work-detail__cobbles-block">
                  <CobblesTitle />
                  <span className="featured-work-detail__description featured-work-detail__cobbles-description">
                    66% Caribbean Grand Cru ganache, coated in dark chocolate
                    and cocoa powder.
                  </span>
                </div>
              ) : null}
              <button
                className="featured-work-detail__more-information"
                aria-controls={`more-information-${activeWork.id}`}
                aria-expanded={isMoreInformationVisible}
                onClick={() =>
                  setIsMoreInformationVisible((isVisible) => !isVisible)
                }
                type="button"
              >
                <span aria-hidden="true">
                  {isMoreInformationVisible ? '−' : '+'}
                </span>
                <span>More information</span>
              </button>
              <span
                id={`more-information-${activeWork.id}`}
                className={`featured-work-detail__more-information-copy ${
                  isMoreInformationVisible
                    ? 'featured-work-detail__more-information-copy--visible'
                    : ''
                }`}
              >
                {activeWork.id === 'matiere-origin' ? (
                  <>
                    <span>Available in 16 / 32 / 48 pieces</span>
                    <span className="featured-work-detail__allergens">
                      <strong>Allergens:</strong> Contains hazelnuts, almonds and
                      soy. May contain traces of milk and other tree nuts.
                    </span>
                  </>
                ) : activeWork.id === 'bonbon-archive' ? (
                  <>
                    <span>Available in 13 / 26 / 39 pieces</span>
                    <span className="featured-work-detail__allergens">
                      <strong>Allergens:</strong> Milk, soya, tree nuts
                      (hazelnuts, almonds).
                    </span>
                  </>
                ) : activeWork.id === 'noir-72' ? (
                  <>
                    <span>NU01 is only available in 18 pieces.</span>
                    <span className="featured-work-detail__availability-line">
                      CO is available in 16 and 32 pieces.
                    </span>
                    <span className="featured-work-detail__allergens">
                      <strong>Allergens:</strong> Milk and soy.
                    </span>
                  </>
                ) : activeWork.id === 'atelier-cape-town' ? (
                  <>
                    <span>Available in 12 / 24 / 36 pieces</span>
                    <span className="featured-work-detail__allergens">
                      <strong>Allergens:</strong> Milk, soya, tree nuts
                      (hazelnuts, almonds), wheat (gluten).
                    </span>
                  </>
                ) : null}
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
                : [0, 1, 2].map((index) => {
                    const product = productsByCategory[activeWork.id]?.[index];

                    return product ? (
                      <CategoryProductPanel
                        key={product.id}
                        product={product}
                      />
                    ) : (
                      <article
                        className={`featured-work-detail__panel featured-work-detail__panel--product-slot ${activeWork.palette}`}
                        key={`${activeWork.id}-slot-${index}`}
                      >
                        <div className="featured-work-detail__image" />
                      </article>
                    );
                  })}
              {activeWork.id === 'bonbon-archive' ? (
                <article className="featured-work-detail__panel featured-work-detail__panel--ascii-image">
                  <AsciiImage
                    image={{
                      src: '/images/essentiel-fourth-panel.png?v=2',
                      alt: 'Essentiel chocolate assortment',
                    }}
                    revealOptions={{size: 120, softness: 16}}
                  />
                </article>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
