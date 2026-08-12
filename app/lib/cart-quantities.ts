export const CART_QUANTITIES_EVENT = 'le-chocolat-cart-quantities';

let currentCartQuantities: Record<string, number> = {};
let reservedCartQuantities: Record<string, number> = {};

function notifyCartQuantities() {
  const quantities = {...currentCartQuantities};
  for (const [merchandiseId, reservedQuantity] of Object.entries(
    reservedCartQuantities,
  )) {
    quantities[merchandiseId] = Math.max(
      quantities[merchandiseId] || 0,
      reservedQuantity,
    );
  }
  window.dispatchEvent(
    new CustomEvent(CART_QUANTITIES_EVENT, {detail: quantities}),
  );
}

export function getCartQuantity(merchandiseId?: string) {
  if (!merchandiseId) return 0;
  return Math.max(
    currentCartQuantities[merchandiseId] || 0,
    reservedCartQuantities[merchandiseId] || 0,
  );
}

export function reserveCartQuantity(merchandiseId: string, quantity: number) {
  reservedCartQuantities[merchandiseId] = quantity;
  notifyCartQuantities();
}

export function releaseCartQuantity(merchandiseId: string) {
  delete reservedCartQuantities[merchandiseId];
  notifyCartQuantities();
}

export function publishCartQuantities(quantities: Record<string, number>) {
  currentCartQuantities = quantities;
  for (const [merchandiseId, reservedQuantity] of Object.entries(
    reservedCartQuantities,
  )) {
    if ((quantities[merchandiseId] || 0) >= reservedQuantity) {
      delete reservedCartQuantities[merchandiseId];
    }
  }
  notifyCartQuantities();
}
