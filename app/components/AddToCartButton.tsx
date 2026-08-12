import {useEffect, useRef, useState} from 'react';
import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {
  CART_QUANTITIES_EVENT,
  getCartQuantity,
  releaseCartQuantity,
  reserveCartQuantity,
} from '~/lib/cart-quantities';

type CartMutationResponse = {
  userErrors?: Array<{code?: string | null; message?: string | null}>;
  warnings?: Array<{code?: string | null; message?: string | null}>;
};

const STOCK_CODES = new Set([
  'MAXIMUM_EXCEEDED',
  'MERCHANDISE_NOT_APPLICABLE',
  'MERCHANDISE_NOT_ENOUGH_STOCK',
  'MERCHANDISE_OUT_OF_STOCK',
]);

function isStockFailure(response?: CartMutationResponse) {
  const messages = [
    ...(response?.userErrors || []),
    ...(response?.warnings || []),
  ];

  return messages.some(
    ({code, message}) =>
      (code ? STOCK_CODES.has(code) : false) ||
      /out of stock|not enough stock|not available|unavailable/i.test(
        message || '',
      ),
  );
}

function AddToCartSubmitButton({
  children,
  disabled,
  fetcher,
  maxQuantity,
  merchandiseId,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  fetcher: FetcherWithComponents<CartMutationResponse>;
  maxQuantity?: number;
  merchandiseId?: string;
  onClick?: () => void;
}) {
  const [isSoldOut, setIsSoldOut] = useState(Boolean(disabled));
  const [cartQuantity, setCartQuantity] = useState(() =>
    getCartQuantity(merchandiseId),
  );
  const [reservedQuantity, setReservedQuantity] = useState<number | null>(null);
  const submissionStartedRef = useRef(false);
  const effectiveQuantity = Math.max(
    cartQuantity,
    reservedQuantity ?? cartQuantity,
  );
  const hasReachedStock =
    typeof maxQuantity === 'number' && effectiveQuantity >= maxQuantity;

  useEffect(() => {
    setIsSoldOut(Boolean(disabled));
  }, [disabled]);

  useEffect(() => {
    if (fetcher.state !== 'idle') {
      submissionStartedRef.current = true;
      return;
    }
    if (!submissionStartedRef.current || reservedQuantity === null) return;

    submissionStartedRef.current = false;

    if (isStockFailure(fetcher.data)) {
      if (merchandiseId) releaseCartQuantity(merchandiseId);
      setReservedQuantity(null);
      setIsSoldOut(true);
    } else if (getCartQuantity(merchandiseId) < reservedQuantity) {
      if (merchandiseId) releaseCartQuantity(merchandiseId);
      setReservedQuantity(null);
    }
  }, [fetcher.data, fetcher.state, merchandiseId, reservedQuantity]);

  useEffect(() => {
    setCartQuantity(getCartQuantity(merchandiseId));
    const updateQuantity = (event: Event) => {
      const quantities = (event as CustomEvent<Record<string, number>>).detail;
      const nextQuantity = merchandiseId
        ? quantities?.[merchandiseId] || 0
        : 0;
      setCartQuantity(nextQuantity);
      if (
        !disabled &&
        (typeof maxQuantity !== 'number' || nextQuantity < maxQuantity)
      ) {
        setIsSoldOut(false);
      }
      setReservedQuantity((reserved) =>
        reserved !== null && nextQuantity >= reserved ? null : reserved,
      );
    };
    window.addEventListener(CART_QUANTITIES_EVENT, updateQuantity);
    return () =>
      window.removeEventListener(CART_QUANTITIES_EVENT, updateQuantity);
  }, [disabled, maxQuantity, merchandiseId]);

  return (
    <button
      aria-busy={fetcher.state !== 'idle'}
      aria-disabled={isSoldOut || hasReachedStock}
      type="submit"
      onClick={(event) => {
        if (isSoldOut || hasReachedStock) {
          event.preventDefault();
          return;
        }
        submissionStartedRef.current = false;
        const nextQuantity = cartQuantity + 1;
        setReservedQuantity(nextQuantity);
        if (merchandiseId) {
          reserveCartQuantity(merchandiseId, nextQuantity);
        }
        onClick?.();
      }}
      disabled={fetcher.state !== 'idle'}
    >
      <span aria-live="polite">
        {isSoldOut || hasReachedStock
          ? 'Sold out'
          : fetcher.state === 'idle'
            ? children
            : 'Adding…'}
      </span>
    </button>
  );
}

export function AddToCartButton({
  analytics,
  children,
  disabled,
  maxQuantity,
  merchandiseId,
  lines,
  onClick,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  maxQuantity?: number;
  merchandiseId?: string;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<CartMutationResponse>) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <AddToCartSubmitButton
            disabled={disabled}
            fetcher={fetcher}
            maxQuantity={maxQuantity}
            merchandiseId={merchandiseId}
            onClick={onClick}
          >
            {children}
          </AddToCartSubmitButton>
        </>
      )}
    </CartForm>
  );
}
