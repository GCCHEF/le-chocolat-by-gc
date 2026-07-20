import {useEffect, useLayoutEffect, useState, type ReactNode} from 'react';
import {useLocation} from 'react-router';
import type {TextureProductsQuery} from 'storefrontapi.generated';
import FeaturedWork from './FeaturedWork';
import LoadingIntro from './LoadingIntro';
import MatiereGradientTransition from './MatiereGradientTransition';
import './homeExperience.css';

const TITLE_REVEAL_DURATION_MS = 3650;

export default function HomePage({
  children,
  products,
}: {
  children: ReactNode;
  products: Array<
    NonNullable<
      | TextureProductsQuery['cu1']
      | TextureProductsQuery['cu2']
      | TextureProductsQuery['cu3']
    >
  >;
}) {
  const location = useLocation();
  const isCreationDestination = location.hash === '#creation';
  const [isIntroActive, setIsIntroActive] = useState(!isCreationDestination);
  const [isHomepageVisible, setIsHomepageVisible] = useState(
    isCreationDestination,
  );
  const [isTitleRevealActive, setIsTitleRevealActive] = useState(false);
  const [isTitleVisible, setIsTitleVisible] = useState(isCreationDestination);
  const [didBypassIntroOnRefresh, setDidBypassIntroOnRefresh] = useState(false);

  useLayoutEffect(() => {
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
  ]);

  useLayoutEffect(() => {
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
          <FeaturedWork products={products} />
          {children}
        </div>
      ) : null}
    </main>
  );
}
