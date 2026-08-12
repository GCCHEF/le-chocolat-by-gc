import {useNavigate} from 'react-router';
import {useState} from 'react';
import type {Route} from './+types/pages.collection-address';
import {useAndroidDevice} from '~/lib/use-android-device';

export const meta: Route.MetaFunction = () => [
  {title: 'Le Chocolat | Collection Address'},
];

export default function CollectionAddressPage() {
  const isAndroid = useAndroidDevice();
  const navigate = useNavigate();
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
            aria-label="Return to previous page"
            className="collection-address-page__menu-return reset"
            disabled={isPageExiting}
            onClick={() => {
              window.sessionStorage.setItem(
                'le-chocolat-return-to-menu',
                '1',
              );
              setIsPageExiting(true);
              window.setTimeout(() => {
                void navigate('/', {
                  state: {bypassIntro: true, openMenu: true},
                });
              }, 200);
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
            <form action="/maps/google" method="get" target="_blank">
              <button
                aria-label="Directions to Makers Landing on Google Maps"
                onClick={(event) => {
                  event.currentTarget.form?.setAttribute(
                    'action',
                    `/maps/google?open=${Date.now()}`,
                  );
                }}
                type="submit"
              >
                Google Maps
                <svg
                  aria-hidden="true"
                  className="collection-address-page__link-arrow"
                  viewBox="0 0 16 16"
                >
                  <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
                </svg>
              </button>
            </form>
            <a
              aria-label="Directions to Le Chocolat at Makers Landing on Apple Maps"
              href="https://maps.apple.com/?q=Makers%20Landing%2C%20Cape%20Town%2C%20South%20Africa"
              rel="noreferrer"
              target="_blank"
            >
              Apple Maps
              <svg
                aria-hidden="true"
                className="collection-address-page__link-arrow"
                viewBox="0 0 16 16"
              >
                <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
              </svg>
            </a>
          </nav>
        </div>
      </div>

      <figure className="collection-address-page__map">
        <img
          alt="Map showing the Le Chocolat collection location in Cape Town"
          src={
            isAndroid
              ? '/images/collection-address-map-v3-android.webp'
              : '/images/collection-address-map-v3.png'
          }
        />
      </figure>
    </section>
  );
}
