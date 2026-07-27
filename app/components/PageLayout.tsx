import {Await, Link, useLocation} from 'react-router';
import {Suspense, useEffect, useId, useLayoutEffect, useRef} from 'react';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside, useAside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header, HeaderMenu} from '~/components/Header';
import {CartMain} from '~/components/CartMain';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
}: PageLayoutProps) {
  const location = useLocation();
  const isContactPage =
    location.pathname === '/pages/contact' ||
    location.pathname === '/pages/collection-address';

  return (
    <Aside.Provider>
      <MenuRouteOpener />
      <MenuNavigationCloser />
      <CartAside cart={cart} />
      <SearchAside />
      <MobileMenuAside header={header} publicStoreDomain={publicStoreDomain} />
      {header && (
        <Header
          header={header}
          cart={cart}
          isLoggedIn={isLoggedIn}
          publicStoreDomain={publicStoreDomain}
        />
      )}
      <main>{children}</main>
      {!isContactPage ? (
        <Footer
          footer={footer}
          header={header}
          publicStoreDomain={publicStoreDomain}
        />
      ) : null}
    </Aside.Provider>
  );
}

function MenuNavigationCloser() {
  const location = useLocation();
  const {close, type} = useAside();
  const currentUrl = `${location.pathname}${location.search}${location.hash}`;
  const previousUrlRef = useRef(currentUrl);

  useEffect(() => {
    const didNavigate = previousUrlRef.current !== currentUrl;
    previousUrlRef.current = currentUrl;

    if (didNavigate && type === 'mobile') {
      close();
    }
  }, [close, currentUrl, type]);

  return null;
}

function MenuRouteOpener() {
  const location = useLocation();
  const {open} = useAside();
  const handledLocationKeyRef = useRef<string | null>(null);
  const routeState = location.state as {
    bypassIntro?: boolean;
    openMenu?: boolean;
  } | null;

  useLayoutEffect(() => {
    if (!routeState?.openMenu) return;
    if (handledLocationKeyRef.current === location.key) return;
    handledLocationKeyRef.current = location.key;

    document.documentElement.classList.add('menu-route-return');
    const storedMenuScrollY = Number(
      window.sessionStorage.getItem('le-chocolat-menu-scroll-y'),
    );
    if (Number.isFinite(storedMenuScrollY)) {
      window.scrollTo(0, storedMenuScrollY);
    }
    open('mobile');

    const currentHistoryState = window.history.state as Record<
      string,
      unknown
    > | null;
    window.history.replaceState(
      {
        ...currentHistoryState,
        usr: routeState.bypassIntro ? {bypassIntro: true} : null,
      },
      '',
      `${location.pathname}${location.search}${location.hash}`,
    );

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.documentElement.classList.remove('menu-route-return');
      });
    });

  }, [
    location.hash,
    location.key,
    location.pathname,
    location.search,
    open,
    routeState?.bypassIntro,
    routeState?.openMenu,
  ]);

  return null;
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Aside type="cart" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

function SearchAside() {
  const queriesDatalistId = useId();
  return (
    <Aside type="search" heading="SEARCH">
      <div className="predictive-search">
        <br />
        <SearchFormPredictive>
          {({fetchResults, goToSearch, inputRef}) => (
            <>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Search"
                ref={inputRef}
                type="search"
                list={queriesDatalistId}
              />
              &nbsp;
              <button onClick={goToSearch}>Search</button>
            </>
          )}
        </SearchFormPredictive>

        <SearchResultsPredictive>
          {({items, total, term, state, closeSearch}) => {
            const {articles, collections, pages, products, queries} = items;

            if (state === 'loading' && term.current) {
              return <div>Loading...</div>;
            }

            if (!total) {
              return <SearchResultsPredictive.Empty term={term} />;
            }

            return (
              <>
                <SearchResultsPredictive.Queries
                  queries={queries}
                  queriesDatalistId={queriesDatalistId}
                />
                <SearchResultsPredictive.Products
                  products={products}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Collections
                  collections={collections}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Pages
                  pages={pages}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Articles
                  articles={articles}
                  closeSearch={closeSearch}
                  term={term}
                />
                {term.current && total ? (
                  <Link
                    onClick={closeSearch}
                    to={`${SEARCH_ENDPOINT}?q=${term.current}`}
                  >
                    <p>
                      View all results for <q>{term.current}</q>
                      &nbsp; →
                    </p>
                  </Link>
                ) : null}
              </>
            );
          }}
        </SearchResultsPredictive>
      </div>
    </Aside>
  );
}

function MobileMenuAside({
  header,
  publicStoreDomain,
}: {
  header: PageLayoutProps['header'];
  publicStoreDomain: PageLayoutProps['publicStoreDomain'];
}) {
  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="MENU">
        <HeaderMenu
          menu={header.menu}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
      </Aside>
    )
  );
}
