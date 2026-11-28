/**
 * react-native-iap stub for macOS bundles ONLY (wired up in
 * metro.config.js; iOS/Android resolve the real package).
 *
 * react-native-iap (StoreKit / Play Billing) ships no react-native-macos
 * build, so the module cannot resolve for the macos platform.
 * src/lib/purchases.ts lazy-requires purchases-native.ts on every
 * non-web platform — macOS included — and that file imports this
 * module at the top level. The stub's semantics match the app's
 * existing "store unavailable" path: useIAP reports not connected
 * with no products, listeners return removable no-ops, restore finds
 * nothing, and Pro is NEVER granted through it (Joey's standing
 * rule). The Pro screen on Mac therefore behaves exactly like the
 * phone app does before store products exist.
 */

export type Product = { productId: string };
export type ProductSubscription = { productId: string };
export type Purchase = { productId: string };
export type PurchaseError = { message?: string };

const remove = () => ({ remove: () => {} });

export function useIAP() {
  return {
    connected: false,
    products: [] as Product[],
    subscriptions: [] as ProductSubscription[],
    requestPurchase: async () => undefined,
    finishTransaction: async () => undefined,
    fetchProducts: async () => undefined,
  };
}

export function purchaseUpdatedListener(_cb: (p: Purchase) => void) {
  return remove();
}

export function purchaseErrorListener(_cb: (e: PurchaseError) => void) {
  return remove();
}

export async function getAvailablePurchases(): Promise<Purchase[]> {
  return [];
}

export function isUserCancelledError(_e: unknown): boolean {
  return false;
}

export default {};
