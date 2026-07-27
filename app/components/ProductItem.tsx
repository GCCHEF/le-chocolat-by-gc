import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

export function ProductItem({
  product,
  loading,
  presentation = 'default',
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
  presentation?: 'default' | 'recommendation';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  return (
    <Link
      className={`product-item product-item--${presentation}`}
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {image && (
        <div className="product-item__image">
          <Image
            alt={image.altText || product.title}
            aspectRatio="1/1"
            data={image}
            loading={loading}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        </div>
      )}
      <h4>{product.title}</h4>
      {presentation === 'default' && (
        <small>
          <Money data={product.priceRange.minVariantPrice} />
        </small>
      )}
    </Link>
  );
}
