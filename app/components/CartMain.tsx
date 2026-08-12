import {useEffect} from 'react';
import {useOptimisticCart, type OptimisticCartLine} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';
import {publishCartQuantities} from '~/lib/cart-quantities';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};
function publishLineQuantities(lines: CartLine[]) {
  const quantities: Record<string, number> = {};
  for (const line of lines) {
    const merchandiseId = line.merchandise?.id;
    if (!merchandiseId) continue;
    quantities[merchandiseId] =
      (quantities[merchandiseId] || 0) + line.quantity;
  }
  publishCartQuantities(quantities);
}
/** Returns a map of all line items and their children. */
function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const children = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(children)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}
/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);

  useEffect(() => {
    publishLineQuantities(cart?.lines?.nodes ?? []);
  }, [cart?.lines?.nodes]);

  return (
    <div className={className}>
      <CartEmpty hidden={linesCount} layout={layout} />
      <div className="cart-details">
        <p id="cart-lines" className="sr-only">
          Line items
        </p>
        <div>
          <ul aria-labelledby="cart-lines">
            {(cart?.lines?.nodes ?? []).map((line) => {
              // we do not render non-parent lines at the root of the cart
              if (
                'parentRelationship' in line &&
                line.parentRelationship?.parent
              ) {
                return null;
              }
              return (
                <CartLineItem
                  key={line.id}
                  line={line}
                  layout={layout}
                  childrenMap={childrenMap}
                />
              );
            })}
          </ul>
        </div>
        {cartHasItems && <CartSummary cart={cart} layout={layout} />}
      </div>
    </div>
  );
}

function CartEmpty({
  hidden = false,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const {closeForNavigation} = useAside();
  const returnToCreation = () => {
    window.dispatchEvent(new CustomEvent('reveal-creation'));
    closeForNavigation();
    const scrollToCreation = () =>
      document.getElementById('creation')?.scrollIntoView({block: 'start'});
    window.requestAnimationFrame(scrollToCreation);
    window.setTimeout(scrollToCreation, 80);
  };
  return (
    <div className="cart-empty" hidden={hidden}>
      <p>Your cart is currently empty.</p>
      <Link
        className="cart-checkout-button"
        to="/#creation"
        onClick={returnToCreation}
        prefetch="viewport"
        preventScrollReset
        state={{bypassIntro: true}}
      >
        Return to E-Shop
      </Link>
    </div>
  );
}
