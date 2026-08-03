import {useEffect, useLayoutEffect, useState, type ReactNode} from 'react';
import {useLocation} from 'react-router';
import type {CategoryProductsQuery} from 'storefrontapi.generated';
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
  textureProducts,
}: {
  categoryProducts: Record<
    string,
    Array<NonNullable<CategoryProductsQuery[keyof CategoryProductsQuery]>>
  >;
  children?: ReactNode;
  discovery: ReactNode;
  textureProducts: Array<
    NonNullable<
      | CategoryProductsQuery['cu1']
      | CategoryProductsQuery['cu2']
      | CategoryProductsQuery['cu3']
    >
  >;
}) {
  const location = useLocation();
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
  const [didBypassIntroOnRefresh, setDidBypassIntroOnRefresh] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const navigationEntry = window.performance.getEntriesByType(
      'navigation',
    )[0] as PerformanceNavigationTiming | undefined;

    if (navigationEntry?.type !== 'reload') return;

    setIsIntroActive(false);
    setIsHomepageVisible(true);
    setIsTitleRevealActive(false);
    setIsTitleVisible(true);
    setDidBypassIntroOnRefresh(true);
    window.history.replaceState(
      window.history.state,
      '',
      `${location.pathname}${location.search}`,
    );
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (
      !isCreationDestination ||
      !isHomepageVisible ||
      didBypassIntroOnRefresh
    ) {
      return;
    }

    const scrollFrame = window.requestAnimationFrame(() => {
      document.getElementById('creation')?.scrollIntoView({block: 'start'});
    });

    return () => window.cancelAnimationFrame(scrollFrame);
  }, [
    didBypassIntroOnRefresh,
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
        <div
          className="home-experience__content home-experience__content--visible"
        >
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
            <p className="home-footer__brand">
              <span className="home-footer__wordmark">
                <img src="/le-chocolat-wordmark.png" alt="Le Chocolat" />
              </span>
              <span className="home-footer__copyright">
                © {new Date().getFullYear()}
              </span>
            </p>
            <a
              className="home-footer__maker"
              aria-label="Gregory Czarnecki on Instagram"
              href="https://www.instagram.com/czarneckigregory/"
              rel="noreferrer"
              target="_blank"
            >
              <span>by</span>
              <img
                src="/images/le-chocolat-gc-monogram-white.png"
                alt="GC"
              />
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
    </main>
  );
}
