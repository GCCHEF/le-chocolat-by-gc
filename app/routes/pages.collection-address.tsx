import {useNavigate} from 'react-router';
import {useState} from 'react';
import type {Route} from './+types/pages.collection-address';
import {useAside} from '~/components/Aside';

export const meta: Route.MetaFunction = () => [
  {title: 'Le Chocolat | Collection Address'},
];

export default function CollectionAddressPage() {
  const navigate = useNavigate();
  const {openAt} = useAside();
  const [isPageExiting, setIsPageExiting] = useState(false);

  return (
    <section
      className={`collection-address-page ${
        isPageExiting ? 'collection-address-page--exiting' : ''
      }`}
      aria-labelledby="collection-address-title"
    >
      <div className="collection-address-page__heading">
        <div className="collection-address-page__title-row">
          <h1 id="collection-address-title">
            <span>Collection</span>
            <span>Address</span>
          </h1>
          <button
            aria-label="Return to menu"
            className="collection-address-page__menu-return reset"
            disabled={isPageExiting}
            onClick={() => {
              setIsPageExiting(true);
              window.setTimeout(() => {
                const storedScrollY = Number(
                  window.sessionStorage.getItem('le-chocolat-menu-scroll-y'),
                );
                const storedOriginUrl =
                  window.sessionStorage.getItem(
                    'le-chocolat-menu-origin-url',
                  ) || '/';
                document.documentElement.classList.add('menu-route-return');
                openAt('mobile', {
                  scrollY: Number.isFinite(storedScrollY) ? storedScrollY : 0,
                  url: storedOriginUrl,
                });
                window.sessionStorage.setItem(
                  'le-chocolat-menu-returning',
                  'true',
                );
                void navigate(-1);
                window.requestAnimationFrame(() => {
                  window.requestAnimationFrame(() => {
                    document.documentElement.classList.remove(
                      'menu-route-return',
                    );
                  });
                });
              }, 700);
            }}
            type="button"
          >
            &times;
          </button>
        </div>
        <div className="collection-address-page__location">
          <address>
            Shop G09, Makers Landing, The Cruise Terminal, V&amp;A Waterfront,
            Cape Town, 8001
          </address>
          <nav aria-label="Directions" className="collection-address-page__links">
            <a
              aria-label="Directions to Makers Landing on Google Maps"
              href="https://www.google.com/maps/dir/?api=1&destination=Makers%20Landing%2C%20Cruise%20Terminal%2C%20V%26A%20Waterfront%2C%20Cape%20Town%2C%208001&travelmode=driving"
              rel="noreferrer"
              target="_blank"
            >
              Google Maps <span aria-hidden="true">↗</span>
            </a>
            <a
              aria-label="Directions to Le Chocolat at Makers Landing on Apple Maps"
              href="https://maps.apple.com/?daddr=Makers%20Landing%2C%20Cruise%20Terminal%2C%20V%26A%20Waterfront%2C%20Cape%20Town%2C%208001&dirflg=d"
              rel="noreferrer"
              target="_blank"
            >
              Apple Maps <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </div>
      </div>

      <figure className="collection-address-page__map">
        <img
          alt="Map showing the Le Chocolat collection location in Cape Town"
          src="/images/collection-address-map-v3.png"
        />
      </figure>
    </section>
  );
}
