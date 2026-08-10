import {useRef, useState} from 'react';
import type {Route} from './+types/box.la-degustation-7f3k9m';

export const meta: Route.MetaFunction = () => [
  {title: 'Le Chocolat | La Dégustation'},
  {name: 'description', content: 'A private Le Chocolat tasting glossary.'},
  {name: 'robots', content: 'noindex, nofollow, noarchive, nosnippet'},
  {name: 'googlebot', content: 'noindex, nofollow, noarchive, nosnippet'},
];

const CHOCOLATES = [
  {name: 'Cobbles', note: 'Small forms with generous textures and unexpected centres.'},
  {name: 'Praline', note: 'Hazelnut, almond and a delicate roasted texture.'},
  {name: 'Assortment', note: 'A composed journey through the signatures of the house.'},
  {name: 'Nuances', note: 'Subtle contrasts, expressed one chocolate at a time.'},
  {name: 'Cubes', note: 'Precise forms with layered flavours and textures.'},
];

export default function PrivateTastingArchive() {
  const [selectedIndex, setSelectedIndex] = useState(2);
  const touchStart = useRef<number | null>(null);
  const selected = CHOCOLATES[selectedIndex];

  function select(direction: number) {
    setSelectedIndex((current) =>
      Math.min(CHOCOLATES.length - 1, Math.max(0, current + direction)),
    );
  }

  return (
    <section className="tasting-archive" aria-labelledby="tasting-archive-title">
      <div className="tasting-archive__masthead">
        <span>Le Chocolat</span>
        <span>Private tasting · 01</span>
      </div>

      <header className="tasting-archive__intro">
        <p className="tasting-archive__eyebrow">Inside the box</p>
        <h1 id="tasting-archive-title">What are you tasting?</h1>
        <p>Move through the words. Stop when one feels familiar.</p>
      </header>

      <section
        aria-label="Flavour glossary"
        className="tasting-archive__scroller"
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const distance = touchStart.current - event.changedTouches[0].clientY;
          if (Math.abs(distance) > 35) select(distance > 0 ? 1 : -1);
          touchStart.current = null;
        }}
        onTouchStart={(event) => {
          touchStart.current = event.touches[0].clientY;
        }}
        onWheel={(event) => {
          if (Math.abs(event.deltaY) > 12) select(event.deltaY > 0 ? 1 : -1);
        }}
      >
        <div className="tasting-archive__words">
          {CHOCOLATES.map((chocolate, index) => {
            const distance = Math.abs(index - selectedIndex);
            const angle = (index - selectedIndex) * 27;
            const radians = (angle * Math.PI) / 180;
            return (
              <button
                aria-current={index === selectedIndex ? 'true' : undefined}
                className="tasting-archive__word"
                data-distance={Math.min(distance, 3)}
                key={chocolate.name}
                onClick={() => setSelectedIndex(index)}
                style={{
                  left: `${Math.cos(radians) * 43}%`,
                  top: `${50 + Math.sin(radians) * 43}%`,
                }}
                type="button"
              >
                {index === selectedIndex && <span aria-hidden="true">→</span>}
                {chocolate.name}
              </button>
            );
          })}
        </div>
        <div className="tasting-archive__progress" aria-hidden="true">
          {CHOCOLATES.map((chocolate, index) => (
            <i className={index === selectedIndex ? 'is-active' : ''} key={chocolate.name} />
          ))}
        </div>
      </section>

      <article className="tasting-archive__entry" aria-live="polite">
        <p className="tasting-archive__entry-number">
          {String(selectedIndex + 1).padStart(2, '0')} / {String(CHOCOLATES.length).padStart(2, '0')}
        </p>
        <h2>{selected.name}</h2>
        <p>{selected.note}</p>
        <button type="button">Discover this chocolate <span aria-hidden="true">↗</span></button>
      </article>

      <footer className="tasting-archive__footer">
        <span>Swipe to explore</span>
        <span>Cape Town</span>
      </footer>
    </section>
  );
}
