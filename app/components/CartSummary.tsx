import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {Money, type OptimisticCart} from '@shopify/hydrogen';
import {useId, useState} from 'react';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';
  const lines = cart?.lines?.nodes ?? [];
  const hasOptimisticLine = lines.some((line) => line.isOptimistic);
  const optimisticCurrency = lines.find(
    (line) => line.cost?.totalAmount ?? line.merchandise.price,
  )?.merchandise.price.currencyCode;
  const optimisticAmount = lines.reduce((total, line) => {
    const confirmedLineAmount = Number(line.cost?.totalAmount?.amount);
    if (Number.isFinite(confirmedLineAmount)) {
      return total + confirmedLineAmount;
    }

    const variantAmount = Number(line.merchandise.price?.amount);
    return Number.isFinite(variantAmount)
      ? total + variantAmount * line.quantity
      : total;
  }, 0);
  const displaySubtotal =
    hasOptimisticLine && optimisticCurrency
      ? {
          amount: optimisticAmount.toFixed(2),
          currencyCode: optimisticCurrency,
        }
      : cart?.cost?.subtotalAmount;

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <h4>Totals</h4>
      <dl className="cart-subtotal">
        <dt>Subtotal</dt>
        <dd>
          {displaySubtotal?.amount ? (
            <Money data={displaySubtotal} />
          ) : (
            '-'
          )}
        </dd>
      </dl>
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  const acknowledgementId = useId();
  const [hasAcknowledgedCollection, setHasAcknowledgedCollection] =
    useState(false);

  if (!checkoutUrl) return null;

  const headlessCheckoutUrl = new URL(checkoutUrl);
  headlessCheckoutUrl.searchParams.set('channel', 'headless-storefronts');

  return (
    <div className="cart-checkout-actions">
      <label
        className="cart-collection-notice cart-collection-acknowledgement"
        htmlFor={acknowledgementId}
      >
        <input
          checked={hasAcknowledgedCollection}
          id={acknowledgementId}
          onChange={(event) =>
            setHasAcknowledgedCollection(event.currentTarget.checked)
          }
          type="checkbox"
        />
        <svg
          aria-hidden="true"
          className="cart-collection-checkbox"
          height="1.55em"
          viewBox="0 0 64 64"
          width="1.55em"
        >
          <path
            className="cart-collection-checkbox__path"
            d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
            pathLength="575.0541381835938"
          />
        </svg>
        <span>
          Orders are available for collection only and usually ready for
          collection the following day.
        </span>
      </label>
      <button
        className="cart-checkout-button"
        disabled={!hasAcknowledgedCollection}
        onClick={() => window.location.assign(headlessCheckoutUrl.toString())}
        type="button"
      >
        Continue to Checkout
      </button>
    </div>
  );
}
