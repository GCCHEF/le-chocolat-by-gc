type StorefrontImage = {
  id?: string | null;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

type ProductWithImages = {
  handle?: string | null;
  images?: {nodes?: Array<StorefrontImage | null> | null} | null;
  featuredImage?: StorefrontImage | null;
};

const cartProductImageCache = new Map<string, string>();

export function rememberCartProductImage(
  merchandiseId: string,
  imageUrl: string,
) {
  cartProductImageCache.set(merchandiseId, imageUrl);
}

export function getRememberedCartProductImage(merchandiseId: string) {
  return cartProductImageCache.get(merchandiseId);
}

/**
 * Shopify Checkout owns media position 1. The Hydrogen storefront deliberately
 * uses position 2, falling back safely while products are being migrated.
 */
export function getStorefrontProductImage(product: ProductWithImages) {
  return (
    product.images?.nodes?.[1] ??
    product.images?.nodes?.[0] ??
    product.featuredImage ??
    null
  );
}
