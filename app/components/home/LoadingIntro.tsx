import {useCallback, useEffect, useRef, useState} from 'react';

const INTRO_DURATION_MS = 2250;
const HOLD_DURATION_MS = 500;
const SCROLL_UNLOCK_DELAY_MS = 500;
const INTRO_ANIMATION_DURATION_MS = 2700;
const WHITE_HOLD_DURATION_MS = 150;
const OVERLAY_FADE_DURATION_MS = 600;

type IntroState =
  | 'loading'
  | 'readyToScroll'
  | 'introAnimating'
  | 'introExiting'
  | 'introComplete';

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function easeInCubic(value: number) {
  return value * value * value;
}

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export default function LoadingIntro({
  onComplete,
  onRevealStart,
}: {
  onComplete: () => void;
  onRevealStart: () => void;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const animationFrameRef = useRef(0);
  const overlayTimerRef = useRef(0);
  const hasTriggeredIntroRef = useRef(false);
  const [count, setCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [introState, setIntroState] = useState<IntroState>('loading');
  const [showPrompt, setShowPrompt] = useState(false);

  const setSceneVariables = useCallback(
    ({
      depthProgress = 0,
      filamentDepth = 0,
      filamentLength = 0,
      filamentOpacity = 1,
      lengthProgress = 0,
      promptOpacity = 1,
      washProgress = 0,
    }: {
      depthProgress?: number;
      filamentDepth?: number;
      filamentLength?: number;
      filamentOpacity?: number;
      lengthProgress?: number;
      promptOpacity?: number;
      washProgress?: number;
    }) => {
      if (!sectionRef.current) return;

      sectionRef.current.style.setProperty(
        '--length-progress',
        String(lengthProgress),
      );
      sectionRef.current.style.setProperty(
        '--depth-progress',
        String(depthProgress),
      );
      sectionRef.current.style.setProperty(
        '--wash-progress',
        String(washProgress),
      );
      sectionRef.current.style.setProperty(
        '--filament-opacity',
        String(filamentOpacity),
      );
      sectionRef.current.style.setProperty(
        '--filament-depth',
        String(filamentDepth),
      );
      sectionRef.current.style.setProperty(
        '--filament-length',
        String(filamentLength),
      );
      sectionRef.current.style.setProperty(
        '--prompt-scroll-opacity',
        String(promptOpacity),
      );
    },
    [],
  );

  const playTriggeredIntro = useCallback(() => {
    if (hasTriggeredIntroRef.current) return;

    hasTriggeredIntroRef.current = true;
    setIntroState('introAnimating');

    const startedAt = window.performance.now();

    const animate = () => {
      const elapsed = window.performance.now() - startedAt;
      const progress = clamp(elapsed / INTRO_ANIMATION_DURATION_MS);
      const promptOpacity = 1 - easeOutCubic(clamp(progress / 0.12));
      const lengthProgress = easeOutCubic(clamp(progress / 0.45));
      const depthProgress = easeInOutCubic(clamp((progress - 0.08) / 0.72));
      const washProgress = easeInOutCubic(clamp((progress - 0.5) / 0.5));
      const filamentDepth = easeInOutCubic(clamp((progress - 0.38) / 0.5));
      const filamentLength = easeOutCubic(clamp(progress / 0.32));
      const filamentOpacity =
        progress < 0.9 ? 1 : 1 - easeInCubic(clamp((progress - 0.9) / 0.1));

      setSceneVariables({
        depthProgress,
        filamentDepth,
        filamentLength,
        filamentOpacity,
        lengthProgress,
        promptOpacity,
        washProgress,
      });

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animate);
        return;
      }

      setSceneVariables({
        depthProgress: 1,
        filamentDepth: 1,
        filamentLength: 1,
        filamentOpacity: 0,
        lengthProgress: 1,
        promptOpacity: 0,
        washProgress: 1,
      });
      overlayTimerRef.current = window.setTimeout(() => {
        onRevealStart();
        setIntroState('introExiting');
        overlayTimerRef.current = window.setTimeout(() => {
          setIntroState('introComplete');
          onComplete();
        }, OVERLAY_FADE_DURATION_MS);
      }, WHITE_HOLD_DURATION_MS);
      animationFrameRef.current = 0;
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);
  }, [onComplete, onRevealStart, setSceneVariables]);

  useEffect(() => {
    const startedAt = window.performance.now();
    let animationFrame = 0;
    let holdTimer = 0;
    let promptTimer = 0;

    const tick = () => {
      const elapsed = window.performance.now() - startedAt;
      const progress = Math.min(elapsed / INTRO_DURATION_MS, 1);
      const nextCount = Math.min(Math.floor(progress * 100), 99);

      setCount(nextCount);
      setLoadingProgress(progress);

      if (progress >= 1) {
        holdTimer = window.setTimeout(() => {
          setIsComplete(true);
          promptTimer = window.setTimeout(() => {
            setShowPrompt(true);
          }, 360);
        }, HOLD_DURATION_MS);
        return;
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(holdTimer);
      window.clearTimeout(promptTimer);
    };
  }, []);

  useEffect(() => {
    if (!showPrompt) {
      return;
    }

    const unlockTimer = window.setTimeout(() => {
      window.scrollTo(0, 0);
      setSceneVariables({});
      setIntroState('readyToScroll');
    }, SCROLL_UNLOCK_DELAY_MS);

    return () => {
      window.clearTimeout(unlockTimer);
    };
  }, [setSceneVariables, showPrompt]);

  useEffect(() => {
    if (introState === 'introComplete') return;

    const previousOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const lockScroll = () => {
      window.scrollTo(0, 0);
    };
    const preventScroll = (event: Event) => {
      event.preventDefault();
      if (introState === 'readyToScroll') {
        playTriggeredIntro();
      }
      lockScroll();
    };
    const preventScrollKeys = (event: KeyboardEvent) => {
      const scrollKeys = new Set([
        ' ',
        'ArrowDown',
        'ArrowUp',
        'End',
        'Home',
        'PageDown',
        'PageUp',
      ]);

      if (!scrollKeys.has(event.key)) return;
      event.preventDefault();
      if (introState === 'readyToScroll') {
        playTriggeredIntro();
      }
      lockScroll();
    };

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    lockScroll();
    window.addEventListener('scroll', lockScroll);
    window.addEventListener('wheel', preventScroll, {passive: false});
    window.addEventListener('touchmove', preventScroll, {passive: false});
    window.addEventListener('keydown', preventScrollKeys);

    return () => {
      window.removeEventListener('scroll', lockScroll);
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', preventScrollKeys);
      document.documentElement.style.overflow = previousOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [introState, playTriggeredIntro]);

  useEffect(() => {
    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      window.clearTimeout(overlayTimerRef.current);
    };
  }, []);

  const progress = isComplete ? 1 : loadingProgress;

  return (
    <section
      ref={sectionRef}
      className={`beam-scroll-scene loading-intro ${
        introState === 'introExiting' ? 'loading-intro--exiting' : ''
      }`}
      aria-label="Loading introduction"
      style={
        {
          '--intro-progress': progress,
        } as React.CSSProperties
      }
    >
      <div className="beam-sticky-viewport loading-intro__sticky">
        <div className="loading-intro__line-wrap">
          <span className="loading-intro__line">
            <span className="loading-intro__beam loading-intro__beam--bloom" />
            <span className="loading-intro__beam loading-intro__beam--medium-glow" />
            <span className="loading-intro__beam loading-intro__beam--optical-core" />
          </span>
        </div>

        <div className="loading-intro__below">
          <span
            className={`loading-intro__counter ${
              isComplete ? 'loading-intro__counter--hidden' : ''
            }`}
            aria-live="polite"
          >
            {String(count).padStart(2, '0')}
          </span>
          <span
            className={`loading-intro__prompt ${
              showPrompt ? 'loading-intro__prompt--visible' : ''
            }`}
            aria-hidden={!showPrompt}
          >
            SCROLL TO EXPLORE
          </span>
        </div>
        <div className="loading-intro__wash" />
      </div>
    </section>
  );
}
