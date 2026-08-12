import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
  CategoryProductsQuery,
  LegalPoliciesQuery,
} from 'storefrontapi.generated';
import HomePage from '~/components/home/HomePage';
import DiscoverCarousel from '~/components/home/DiscoverCarousel';
import homeExperienceStyles from '~/components/home/homeExperience.css?url';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Le Chocolat by GC'},
    {
      name: 'description',
      content:
        'Le Chocolat by Gregory Czarnecki — handcrafted chocolate creations manufactured in Cape Town.',
    },
  ];
};

export const links: Route.LinksFunction = () => [
  {rel: 'stylesheet', href: homeExperienceStyles},
];

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
async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{collections}, categoryProductsResponse] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    context.storefront.query(CATEGORY_PRODUCTS_QUERY, {
      cache: context.storefront.CacheNone(),
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollection: collections.nodes[0],
    textureProducts: [
      categoryProductsResponse.cu1,
      categoryProductsResponse.cu2,
      categoryProductsResponse.cu3,
    ].filter((product) => product != null),
    categoryProducts: {
      'bonbon-archive': [
        categoryProductsResponse.as01,
        categoryProductsResponse.as02,
        categoryProductsResponse.as03,
      ].filter((product) => product != null),
      'noir-72': [
        categoryProductsResponse.or01,
        categoryProductsResponse.co01,
        categoryProductsResponse.co02,
      ].filter((product) => product != null),
      'atelier-cape-town': [
        categoryProductsResponse.pr01,
        categoryProductsResponse.pr02,
        categoryProductsResponse.pr03,
      ].filter((product) => product != null),
    },
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  const legalPolicies = context.storefront
    .query(LEGAL_POLICIES_QUERY, {cache: context.storefront.CacheLong()})
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
    legalPolicies,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();

  return (
    <HomePage
      categoryProducts={data.categoryProducts}
      discovery={<RecommendedProducts products={data.recommendedProducts} />}
      legalPolicies={data.legalPolicies}
      textureProducts={data.textureProducts}
    />
  );
}

const LEGAL_POLICIES_QUERY = `#graphql
  query LegalPolicies($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy { id title body }
      refundPolicy { id title body }
      shippingPolicy { id title body }
      termsOfService { id title body }
    }
  }
` as const;

function FeaturedCollection({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className="featured-collection"
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image data={image} sizes="100vw" />
        </div>
      )}
    </Link>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  const curatedProductCodes = ['CU01', 'AS02', 'PRA02', 'NU01'];

  return (
    <div className="recommended-products">
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="discover-carousel discover-carousel--loading"
          />
        }
      >
        <Await resolve={products}>
          {(response) => (
            <DiscoverCarousel
              products={
                response
                  ? curatedProductCodes
                      .map((code) =>
                        response.products.nodes.find((product) => {
                          const match = product.title
                            .trim()
                            .toUpperCase()
                            .replace(/\s+/g, '')
                            .match(/^([A-Z]+)0*(\d+)$/);
                          if (!match) return false;
                          const family = match[1] === 'PR' ? 'PRA' : match[1];
                          return `${family}${match[2].padStart(2, '0')}` === code;
                        }),
                      )
                      .filter((product) => product != null)
                  : []
              }
            />
          )}
        </Await>
      </Suspense>
    </div>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    images(first: 2) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(
      first: 50
      query: "title:CU* OR title:AS* OR title:PR* OR title:PRA* OR title:NU*"
    ) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;

const CATEGORY_PRODUCTS_QUERY = `#graphql
  query CategoryProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    cu1: product(handle: "cu1") {
      ...CategoryProduct
    }
    cu2: product(handle: "cu2") {
      ...CategoryProduct
    }
    cu3: product(handle: "cu3") {
      ...CategoryProduct
    }
    as01: product(handle: "a-i") {
      ...CategoryProduct
    }
    as02: product(handle: "a2") {
      ...CategoryProduct
    }
    as03: product(handle: "a3") {
      ...CategoryProduct
    }
    or01: product(handle: "sg-1") {
      ...CategoryProduct
    }
    co01: product(handle: "co1") {
      ...CategoryProduct
    }
    co02: product(handle: "co2") {
      ...CategoryProduct
    }
    pr01: product(handle: "pr1") {
      ...CategoryProduct
    }
    pr02: product(handle: "pr2") {
      ...CategoryProduct
    }
    pr03: product(handle: "pr3") {
      ...CategoryProduct
    }
  }
  fragment CategoryProduct on Product {
    id
    title
    featuredImage {
      id
      url
      altText
      width
      height
    }
    images(first: 2) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      availableForSale
      quantityAvailable
      image {
        id
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
      product {
        title
        handle
      }
      selectedOptions {
        name
        value
      }
      title
    }
  }
` as const;
