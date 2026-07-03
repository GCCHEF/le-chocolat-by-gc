import {useState, type ReactNode} from 'react';
import LoadingIntro from './LoadingIntro';
import MatiereGradientTransition from './MatiereGradientTransition';
import './homeExperience.css';

export default function HomePage({children}: {children: ReactNode}) {
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [isHomepageVisible, setIsHomepageVisible] = useState(false);

  return (
    <main
      className={`home-experience ${
        isIntroActive ? 'home-experience--intro-active' : ''
      }`}
    >
      {isIntroActive ? (
        <LoadingIntro
          onRevealStart={() => setIsHomepageVisible(true)}
          onComplete={() => setIsIntroActive(false)}
        />
      ) : null}
      <div
        className={`home-experience__content ${
          isHomepageVisible ? 'home-experience__content--visible' : ''
        }`}
        aria-hidden={!isHomepageVisible}
      >
        <MatiereGradientTransition />
        {children}
      </div>
    </main>
  );
}
