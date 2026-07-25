import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;

  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      document.addEventListener(
        'keydown',
        function handler(event: KeyboardEvent) {
          if (event.key === 'Escape') {
            close();
          }
        },
        {signal: abortController.signal},
      );
    }
    return () => abortController.abort();
  }, [close, expanded]);

  return (
    <div
      aria-modal
      className={`overlay overlay--${type} ${expanded ? 'expanded' : ''}`}
      role="dialog"
    >
      <button className="close-outside" onClick={close} />
      <aside>
        <header>
          <h3>{heading}</h3>
          <button className="close reset" onClick={close} aria-label="Close">
            &times;
          </button>
        </header>
        <main>{children}</main>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const menuOriginRef = useRef({scrollY: 0, url: ''});
  const menuBodyStylesRef = useRef({
    position: '',
    top: '',
    width: '',
  });

  const open = (mode: AsideType) => {
    if (mode === 'mobile' && type !== 'mobile') {
      const scrollY = Math.max(
        window.scrollY,
        document.documentElement.scrollTop,
        document.body.scrollTop,
      );
      menuOriginRef.current = {
        scrollY,
        url: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      };
      menuBodyStylesRef.current = {
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
      };
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    }
    setType(mode);
  };

  const close = () => {
    const origin = menuOriginRef.current;
    const previousBodyStyles = menuBodyStylesRef.current;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const shouldRestoreMenuPosition = currentUrl === origin.url;

    if (type === 'mobile') {
      document.body.style.position = previousBodyStyles.position;
      document.body.style.top = previousBodyStyles.top;
      document.body.style.width = previousBodyStyles.width;
      if (shouldRestoreMenuPosition) {
        window.scrollTo(0, origin.scrollY);
      }
    }
    setType('closed');

    const restoreMenuPosition = () => {
      const latestUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (latestUrl === origin.url) {
        window.scrollTo(0, origin.scrollY);
      }
    };

    if (type === 'mobile') {
      window.requestAnimationFrame(restoreMenuPosition);
    }
  };

  return (
    <AsideContext.Provider
      value={{
        type,
        open,
        close,
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
