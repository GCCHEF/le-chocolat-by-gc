import {useEffect, useState, type ReactNode} from 'react';
import FeaturedWork from './FeaturedWork';
import LoadingIntro from './LoadingIntro';
import MatiereGradientTransition from './MatiereGradientTransition';
import './homeExperience.css';

const TITLE_REVEAL_DURATION_MS = 3300;

export default function HomePage({children}: {children: ReactNode}) {
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [isHomepageVisible, setIsHomepageVisible] = useState(false);
  const [isTitleRevealActive, setIsTitleRevealActive] = useState(false);
  const [isTitleVisible, setIsTitleVisible] = useState(false);

  useEffect(() => {
    if (!isTitleRevealActive) return;

    const previousDocumentOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
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
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.overflow = previousBodyOverflow;
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
      <div
        className={`home-experience__content ${
          isHomepageVisible ? 'home-experience__content--visible' : ''
        }`}
        aria-hidden={!isHomepageVisible}
      >
        <MatiereGradientTransition
          isTitleRevealActive={isTitleRevealActive}
          isTitleVisible={isTitleVisible}
        />
        <FeaturedWork />
        {children}
      </div>
    </main>
  );
}
