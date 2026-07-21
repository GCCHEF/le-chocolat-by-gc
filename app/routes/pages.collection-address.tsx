import {useNavigate} from 'react-router';
import type {Route} from './+types/pages.collection-address';

export const meta: Route.MetaFunction = () => [
  {title: 'Le Chocolat | Collection Address'},
];

export default function CollectionAddressPage() {
  const navigate = useNavigate();

  return (
    <section
      className="collection-address-page"
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
            onClick={() => {
              void navigate('/', {
                state: {bypassIntro: true, openMenu: true},
              });
            }}
            type="button"
          >
            &times;
          </button>
        </div>
        <div className="collection-address-page__location">
          <address>
            The Cruise Terminal, Victoria &amp; Alfred Waterfront, Cape Town,
            8001
          </address>
          <nav aria-label="Directions" className="collection-address-page__links">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=-33.91051%2C18.42596&travelmode=driving"
              rel="noreferrer"
              target="_blank"
            >
              Google Maps <span aria-hidden="true">↗</span>
            </a>
            <a
              href="https://maps.apple.com/?daddr=-33.91051%2C18.42596&dirflg=d"
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
          src="/images/collection-address-map.png"
        />
      </figure>
    </section>
  );
}
