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
        </div>
      ) : null}
    </main>
  );
}
