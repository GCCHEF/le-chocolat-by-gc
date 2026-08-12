import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import {Await, useLocation} from 'react-router';
import type {
  CategoryProductsQuery,
  LegalPoliciesQuery,
} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {
  ALLERGEN_INFORMATION_HTML,
  COLLECTION_POLICY_HTML,
  COOKIE_POLICY_HTML,
  INTELLECTUAL_PROPERTY_HTML,
  PERISHABLE_GOODS_POLICY_HTML,
  PRIVACY_POLICY_HTML,
  PRODUCT_CARE_HTML,
  TERMS_AND_CONDITIONS_HTML,
  WEBSITE_DISCLAIMER_HTML,
} from '~/content/legal';
import FeaturedWork from './FeaturedWork';
import LoadingIntro from './LoadingIntro';
import MatiereGradientTransition from './MatiereGradientTransition';
import './homeExperience.css';

const TITLE_REVEAL_DURATION_MS = 3650;
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function HomePage({
  categoryProducts,
  children,
  discovery,
  legalPolicies,
  textureProducts,
}: {
  categoryProducts: Record<
    string,
    Array<NonNullable<CategoryProductsQuery[keyof CategoryProductsQuery]>>
  >;
  children?: ReactNode;
  discovery: ReactNode;
  legalPolicies: Promise<LegalPoliciesQuery | null>;
  textureProducts: Array<
    NonNullable<
      | CategoryProductsQuery['cu1']
      | CategoryProductsQuery['cu2']
      | CategoryProductsQuery['cu3']
    >
  >;
}) {
  const location = useLocation();
  const {type: asideType} = useAside();
  const routeState = location.state as {bypassIntro?: boolean} | null;
  const isCreationDestination = location.hash === '#creation';
  const shouldBypassIntro = routeState?.bypassIntro === true;
  const [isIntroActive, setIsIntroActive] = useState(
    !isCreationDestination && !shouldBypassIntro,
  );
  const [isHomepageVisible, setIsHomepageVisible] = useState(
    isCreationDestination || shouldBypassIntro,
  );
  const [isTitleRevealActive, setIsTitleRevealActive] = useState(false);
  const [isTitleVisible, setIsTitleVisible] = useState(
    isCreationDestination || shouldBypassIntro,
  );
  const [didOpenAfterRefresh, setDidOpenAfterRefresh] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const legalContentRef = useRef<HTMLDivElement>(null);
  const legalScrollYRef = useRef(0);

  const handleLegalNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    legalScrollYRef.current = Math.max(
      window.scrollY,
      document.documentElement.scrollTop,
      document.body.scrollTop,
    );
    setIsLegalOpen(true);
  };

  useIsomorphicLayoutEffect(() => {
    if (!isLegalOpen) return;
    const scrollY = legalScrollYRef.current || window.scrollY;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLegalOpen(false);
    };

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyStyles.overflow;
      document.body.style.position = previousBodyStyles.position;
      document.body.style.top = previousBodyStyles.top;
      document.body.style.width = previousBodyStyles.width;
      window.scrollTo(0, scrollY);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isLegalOpen]);

  useEffect(() => {
    if (asideType === 'mobile' && isLegalOpen) {
      setIsLegalOpen(false);
    }
  }, [asideType, isLegalOpen]);

  useIsomorphicLayoutEffect(() => {
    const navigationEntry = window.performance.getEntriesByType(
      'navigation',
    )[0] as PerformanceNavigationTiming | undefined;
    const legacyNavigation = window.performance.navigation;
    const isReload =
      navigationEntry?.type === 'reload' || legacyNavigation?.type === 1;
    const hasSeenIntro =
      isReload ||
      document.documentElement.classList.contains('le-chocolat-returning-tab');
    if (isReload) {
      document.documentElement.classList.add('le-chocolat-returning-tab');
    }

    const isInitialDocumentEntry = location.key === 'default';
    const shouldOpenAtHomeTop =
      hasSeenIntro && (isInitialDocumentEntry || !isCreationDestination);

    if (!shouldOpenAtHomeTop) return;

    window.history.scrollRestoration = 'manual';
    setIsIntroActive(false);
    setIsHomepageVisible(true);
    setIsTitleRevealActive(false);
    setIsTitleVisible(true);
    setDidOpenAfterRefresh(true);
    window.history.replaceState(
      window.history.state,
      '',
      `${location.pathname}${location.search}`,
    );

    const keepAtTop = () => window.scrollTo(0, 0);
    keepAtTop();
    const scrollFrame = window.requestAnimationFrame(keepAtTop);
    let revealFrame = 0;
    const readyFrame = window.requestAnimationFrame(() => {
      revealFrame = window.requestAnimationFrame(() => {
        document.documentElement.classList.remove(
          'le-chocolat-refresh-pending',
        );
      });
    });
    const settleTimers = [50, 180, 420].map((delay) =>
      window.setTimeout(keepAtTop, delay),
    );

    return () => {
      window.cancelAnimationFrame(scrollFrame);
      window.cancelAnimationFrame(readyFrame);
      window.cancelAnimationFrame(revealFrame);
      settleTimers.forEach(window.clearTimeout);
    };
  }, [isCreationDestination, location.key, location.pathname, location.search]);

  useIsomorphicLayoutEffect(() => {
    if (isCreationDestination || shouldBypassIntro || didOpenAfterRefresh)
      return;
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [didOpenAfterRefresh, isCreationDestination, shouldBypassIntro]);

  useEffect(() => {
    if (!isCreationDestination || !isHomepageVisible || didOpenAfterRefresh) {
      return;
    }

    const scrollToCreation = () => {
      document.getElementById('creation')?.scrollIntoView({block: 'start'});
    };
    const scrollFrame = window.requestAnimationFrame(scrollToCreation);
    const settleTimers = [50, 180, 420].map((delay) =>
      window.setTimeout(scrollToCreation, delay),
    );

    return () => {
      window.cancelAnimationFrame(scrollFrame);
      settleTimers.forEach(window.clearTimeout);
    };
  }, [
    didOpenAfterRefresh,
    isCreationDestination,
    isHomepageVisible,
    location.key,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (!isTitleRevealActive) return;

    const lockScroll = () => window.scrollTo(0, 0);
    const preventScroll = (event: Event) => {
      event.preventDefault();
      lockScroll();
    };
    const revealTimer = window.setTimeout(() => {
      setIsTitleVisible(true);
      setIsTitleRevealActive(false);
    }, TITLE_REVEAL_DURATION_MS);

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    window.addEventListener('scroll', lockScroll, {passive: true});
    window.addEventListener('wheel', preventScroll, {passive: false});
    window.addEventListener('touchmove', preventScroll, {passive: false});

    return () => {
      window.clearTimeout(revealTimer);
      window.scrollTo(0, 0);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      window.removeEventListener('scroll', lockScroll);
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
    };
  }, [isTitleRevealActive]);

  return (
    <main
      className={`home-experience ${
        isIntroActive ? 'home-experience--intro-active' : ''
      }`}
    >
      {isIntroActive ? (
        <LoadingIntro
          onRevealStart={() => setIsHomepageVisible(true)}
          onComplete={() => {
            setIsIntroActive(false);
            setIsTitleRevealActive(true);
          }}
        />
      ) : null}
      {isHomepageVisible ? (
        <div className="home-experience__content home-experience__content--visible">
          <MatiereGradientTransition
            isTitleRevealActive={isTitleRevealActive}
            isTitleVisible={isTitleVisible}
          />
          {discovery}
          {children}
          <FeaturedWork
            categoryProducts={categoryProducts}
            textureProducts={textureProducts}
          />
          <div className="home-footer-transition" aria-hidden="true" />
          <footer className="home-footer">
            <div className="home-footer__left">
              <a
                className="home-footer__legal"
                href="/policies"
                onClick={handleLegalNavigation}
              >
                Legal
              </a>
              <p className="home-footer__brand">
                <span className="home-footer__wordmark">
                  <img src="/le-chocolat-wordmark.png" alt="Le Chocolat" />
                </span>
                <span className="home-footer__copyright">
                  © {new Date().getFullYear()}
                </span>
              </p>
            </div>
            <a
              className="home-footer__maker"
              aria-label="Gregory Czarnecki on Instagram"
              href="https://www.instagram.com/czarneckigregory/"
              rel="noreferrer"
              target="_blank"
            >
              <span>by</span>
              <img src="/images/le-chocolat-gc-monogram-white.png" alt="GC" />
            </a>
            <nav aria-label="Footer navigation">
              <a
                aria-label="Instagram"
                className="home-footer__action home-footer__instagram"
                href="https://www.instagram.com/lechocolat_by_gc/"
                rel="noreferrer"
                target="_blank"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4.25" />
                  <circle
                    className="home-footer__instagram-dot"
                    cx="17.4"
                    cy="6.7"
                    r="1"
                  />
                </svg>
              </a>
            </nav>
          </footer>
        </div>
      ) : null}
      <div
        aria-hidden={!isLegalOpen}
        aria-modal="true"
        className={`home-legal-overlay ${isLegalOpen ? 'home-legal-overlay--open' : ''}`}
        role="dialog"
      >
        <div className="home-legal-overlay__content" ref={legalContentRef}>
          <div className="home-legal-overlay__title-row">
            <h2>Legal</h2>
            <button
              aria-label="Close legal information"
              className="contact-page__menu-return reset"
              onClick={() => setIsLegalOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>
          <Suspense fallback={<p>Loading legal information…</p>}>
            <Await resolve={legalPolicies}>
              {(response) => {
                const legalSections: Array<{
                  id: string;
                  title: string;
                  body?: string;
                }> = [
                  {
                    id: 'terms-and-conditions',
                    title: 'Terms & Conditions',
                    body: TERMS_AND_CONDITIONS_HTML,
                  },
                  {
                    id: 'privacy-policy',
                    title: 'Privacy Policy',
                    body: PRIVACY_POLICY_HTML,
                  },
                  {
                    id: 'collection-policy',
                    title: 'Collection Policy',
                    body: COLLECTION_POLICY_HTML,
                  },
                  {
                    id: 'perishable-goods-policy',
                    title: 'Perishable Goods Policy',
                    body: PERISHABLE_GOODS_POLICY_HTML,
                  },
                  {
                    id: 'product-care',
                    title: 'Product Care',
                    body: PRODUCT_CARE_HTML,
                  },
                  {
                    id: 'allergen-information',
                    title: 'Allergen Information',
                    body: ALLERGEN_INFORMATION_HTML,
                  },
                  {
                    id: 'cookie-policy',
                    title: 'Cookie Policy',
                    body: COOKIE_POLICY_HTML,
                  },
                  {
                    id: 'website-disclaimer',
                    title: 'Website Disclaimer',
                    body: WEBSITE_DISCLAIMER_HTML,
                  },
                  {
                    id: 'intellectual-property',
                    title: 'Intellectual Property',
                    body: INTELLECTUAL_PROPERTY_HTML,
                  },
                ];

                return (
                  <>
                    <nav
                      aria-label="Legal contents"
                      className="home-legal-overlay__contents"
                    >
                      <ol>
                        {legalSections.map((section) => (
                          <li key={section.id}>
                            <a href={`#${section.id}`}>{section.title}</a>
                          </li>
                        ))}
                      </ol>
                    </nav>
                    <div className="home-legal-overlay__policies">
                      {legalSections.map((section, index) => (
                        <section
                          data-legal-section={index}
                          id={section.id}
                          key={section.id}
                        >
                          <div className="home-legal-overlay__section-title">
                            <h3>{section.title}</h3>
                            <button
                              aria-label={`Return to the top of Legal from ${section.title}`}
                              className="contact-page__menu-return home-legal-overlay__section-return reset"
                              onClick={() =>
                                legalContentRef.current?.scrollTo({
                                  behavior: 'smooth',
                                  top: 0,
                                })
                              }
                              type="button"
                            >
                              ×
                            </button>
                          </div>
                          {section.body ? (
                            <div
                              dangerouslySetInnerHTML={{__html: section.body}}
                            />
                          ) : null}
                        </section>
                      ))}
                    </div>
                  </>
                );
              }}
            </Await>
          </Suspense>
        </div>
      </div>
    </main>
  );
}
