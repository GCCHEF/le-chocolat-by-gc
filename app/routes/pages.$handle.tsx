import {useLoaderData, useLocation, useNavigate} from 'react-router';
import {useState} from 'react';
import type {Route} from './+types/pages.$handle';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import homeExperienceStyles from '~/components/home/homeExperience.css?url';

export const links: Route.LinksFunction = () => [
  {rel: 'stylesheet', href: homeExperienceStyles},
];

const DROPLET_CELL_NAMES = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty',
  'twenty-one',
  'twenty-two',
  'twenty-three',
  'twenty-four',
  'twenty-five',
  'twenty-six',
  'twenty-seven',
  'twenty-eight',
  'twenty-nine',
  'thirty',
  'thirty-one',
  'thirty-two',
];

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Hydrogen | ${data?.page.title ?? ''}`}];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const [{page}] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.handle, data: page});

  return {
    page,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();

  if (page.handle === 'contact') {
    return <ContactPage />;
  }

  return (
    <div className="page">
      <header>
        <h1>{page.title}</h1>
      </header>
      <main dangerouslySetInnerHTML={{__html: page.body}} />
    </div>
  );
}

function ContactPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const subjects = [
    'General enquiry',
    'Order enquiry',
    'Bespoke order',
    'Collaboration',
  ];
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const availableSubjects = subjects.filter(
    (subject) => subject !== selectedSubject,
  );

  return (
    <section
      className="contact-page"
      aria-labelledby="contact-title"
    >
      <div
        className="contact-page__droplets"
        aria-hidden="true"
        key={location.search}
      >
        <div className="matiere-corner-matter">
          {DROPLET_CELL_NAMES.map((name) => (
            <span
              className={`matiere-corner-matter__cell matiere-corner-matter__cell--${name}`}
              key={name}
            />
          ))}
        </div>
        <span className="matiere-corner-satellite matiere-corner-satellite--one" />
        <span className="matiere-corner-satellite matiere-corner-satellite--two" />
      </div>
      <div className="contact-page__intro">
        <div className="contact-page__title-row">
          <h1 id="contact-title">Contact</h1>
          <button
            aria-label="Return to menu"
            className="contact-page__menu-return reset"
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
        <p>
          For orders, bespoke requests or general enquiries, write to our
          manufacture.
        </p>
      </div>

      <form className="contact-form" onSubmit={(event) => event.preventDefault()}>
        <div className="contact-form__field">
          <label htmlFor="contact-name">Name</label>
          <input id="contact-name" name="name" required type="text" />
        </div>
        <div className="contact-form__field">
          <label htmlFor="contact-email">Email</label>
          <input id="contact-email" name="email" required type="email" />
        </div>
        <div className="contact-form__field">
          <label htmlFor="contact-phone">Phone number</label>
          <input id="contact-phone" name="phone" type="tel" />
        </div>
        <div className="contact-form__field contact-form__field--subject">
          <label htmlFor="contact-subject-trigger" id="contact-enquiry-label">
            Subject
          </label>
          <div className="contact-form__subject-select">
            <input name="enquiry" type="hidden" value={selectedSubject} />
            <button
              aria-controls="contact-subject-options"
              aria-expanded={isSubjectOpen}
              aria-labelledby="contact-enquiry-label contact-subject-value"
              className="contact-form__subject-trigger"
              id="contact-subject-trigger"
              onClick={() => setIsSubjectOpen((isOpen) => !isOpen)}
              type="button"
            >
              <span id="contact-subject-value">{selectedSubject}</span>
              <span
                aria-hidden="true"
                className={`contact-form__subject-arrow ${
                  isSubjectOpen ? 'contact-form__subject-arrow--open' : ''
                }`}
              />
            </button>
            <div
              className={`contact-form__subject-options ${
                isSubjectOpen ? 'contact-form__subject-options--open' : ''
              }`}
              id="contact-subject-options"
              role="listbox"
            >
              {availableSubjects.map((subject) => (
                <button
                  aria-selected="false"
                  className="contact-form__subject-option"
                  key={subject}
                  onClick={() => {
                    setSelectedSubject(subject);
                    setIsSubjectOpen(false);
                  }}
                  role="option"
                  type="button"
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="contact-form__field contact-form__field--message">
          <label htmlFor="contact-message">Message</label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={7}
          />
        </div>
        <button className="contact-form__submit" disabled type="submit">
          Send enquiry
        </button>
      </form>
    </section>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      handle
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
` as const;
