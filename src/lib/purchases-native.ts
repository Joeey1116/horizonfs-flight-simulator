/**
 * In-app purchases — NATIVE ONLY (iOS/Android).
 *
 * Never import this file from a module that loads on web: it imports
 * react-native-iap at the top level, and that module throws when
 * evaluated on web. The web-safe entry point is ./purchases.ts, which
 * lazy-requires this file only on native. (Metro does NOT reliably
 * resolve .web.ts shims for Expo web, so the split is explicit files +
 * a Platform.OS check, not a .web.ts stub.)
 *
 * STRUCTURE ONLY, mirroring the proven Motivation app pattern
 * (beatrackfam-motivation-app/lib/purchases.ts, react-native-iap v17):
 * event-based purchase listeners, finish-first-then-grant, restore via
 * the query API, products prefetched once connected.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  useIAP,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getAvailablePurchases as queryAvailablePurchases,
  isUserCancelledError,
  type Product,
  type ProductSubscription,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap';
import { setPro } from './pro';
import { IAP_SKUS, SUB_SKUS } from './iap-skus';


/**
 * requestPurchase is EVENT-BASED in react-native-iap v17: the promise it
 * returns does not carry the outcome. The real result arrives through the
 * global purchaseUpdatedListener / purchaseErrorListener below.
 */
type PendingPurchase = { sku: string; resolve: (ok: boolean) => void };
let pendingPurchase: PendingPurchase | null = null;
let globalListenersAttached = false;
let finishTxRef: ((args: {
  purchase: Purchase;
  isConsumable?: boolean;
}) => Promise<void>) | null = null;

function settlePending(ok: boolean) {
  const p = pendingPurchase;
  pendingPurchase = null;
  if (p) p.resolve(ok);
}

export function useProNative() {
  const {
    connected,
    products,
    subscriptions,
    requestPurchase,
    finishTransaction,
    fetchProducts,
  } = useIAP();

  const [productsLoading, setProductsLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    finishTxRef = finishTransaction;
  });

  // Attach the global purchase/error listeners once per app session.
  // The purchase listener is the ONLY place Pro gets granted: only on a
  // verified transaction whose productId is one of our SKUs.
  useEffect(() => {
    if (globalListenersAttached) return;
    globalListenersAttached = true;

    const updateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
      try {
        const sku = purchase.productId;
        const isOurs = SUB_SKUS.includes(sku) || IAP_SKUS.includes(sku);
        if (isOurs) {
          // Finish FIRST so the store never redelivers, then grant.
          try {
            await finishTxRef?.({ purchase });
          } catch (e) {
            console.error('[purchases] finishTransaction failed:', e);
          }
          await setPro(true);
        } else {
          console.warn('[purchases] transaction for unknown SKU:', sku);
        }
        settlePending(isOurs);
      } catch (e) {
        console.error('[purchases] purchaseUpdatedListener failed:', e);
        settlePending(false);
      }
    });

    const errorSub = purchaseErrorListener((error: PurchaseError) => {
      if (!isUserCancelledError(error)) {
        console.error('[purchases] purchase error:', error?.code, error?.message);
      }
      settlePending(false);
    });

    return () => {
      updateSub.remove();
      errorSub.remove();
      globalListenersAttached = false;
    };
  }, []);

  // Prefetch store products once connected so the paywall never opens on
  // a cold fetch. Until the SKUs exist in the stores, this finds nothing
  // and productsLoading simply clears.
  useEffect(() => {
    if (!connected) return;
    let cancelled = false;
    (async () => {
      try {
        await fetchProducts({ skus: SUB_SKUS, type: 'subs' });
        await fetchProducts({ skus: IAP_SKUS, type: 'in-app' });
      } catch (e) {
        console.error('[purchases] fetchProducts failed:', e);
      } finally {
        if (!cancelled && mountedRef.current) setProductsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connected, fetchProducts]);

  /**
   * Starts a Pro subscription purchase and resolves TRUE only when a
   * verified transaction for this SKU comes back through the purchase
   * listener. Resolves FALSE on user cancel or any failure — never grants
   * on failure.
   */
  const purchase = useCallback(
    async (sku: string): Promise<boolean> => {
      if (pendingPurchase) {
        console.warn('[purchases] purchase already in flight — ignoring');
        return false;
      }
      setPurchasing(true);
      try {
        return await new Promise<boolean>((resolve) => {
          pendingPurchase = { sku, resolve };
          requestPurchase({
            request: {
              apple: { sku },
              google: { skus: [sku] },
            },
            type: 'subs',
          }).catch((e) => {
            console.error('[purchases] requestPurchase threw:', e);
            settlePending(false);
          });
        });
      } finally {
        if (mountedRef.current) setPurchasing(false);
      }
    },
    [requestPurchase],
  );

  /** One-time purchase (Pro Lifetime) — same pattern, type 'in-app'. */
  const purchaseInApp = useCallback(
    async (sku: string): Promise<boolean> => {
      if (pendingPurchase) {
        console.warn('[purchases] purchase already in flight — ignoring');
        return false;
      }
      setPurchasing(true);
      try {
        return await new Promise<boolean>((resolve) => {
          pendingPurchase = { sku, resolve };
          requestPurchase({
            request: {
              apple: { sku },
              google: { skus: [sku] },
            },
            type: 'in-app',
          }).catch((e) => {
            console.error('[purchases] requestPurchase threw:', e);
            settlePending(false);
          });
        });
      } finally {
        if (mountedRef.current) setPurchasing(false);
      }
    },
    [requestPurchase],
  );

  /**
   * Restores a previous purchase. Uses the query API directly (it returns
   * the purchase array) instead of the hook's availablePurchases STATE,
   * which would be stale immediately after the await.
   */
  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const purchases = await queryAvailablePurchases();
      const ok = purchases.some(
        (p) => SUB_SKUS.includes(p.productId) || IAP_SKUS.includes(p.productId),
      );
      if (ok) await setPro(true);
      return ok;
    } catch (e) {
      console.error('[purchases] restore failed:', e);
      return false;
    }
  }, []);

  const sorted = [...subscriptions].sort((a, b) => {
    const priceA = typeof a.price === 'number' ? a.price : 0;
    const priceB = typeof b.price === 'number' ? b.price : 0;
    return priceA - priceB;
  });

  const sortedProducts = [...products].sort((a, b) => {
    const priceA = typeof a.price === 'number' ? a.price : 0;
    const priceB = typeof b.price === 'number' ? b.price : 0;
    return priceA - priceB;
  });

  return {
    subscriptions: sorted as ProductSubscription[],
    /** One-time products (Pro Lifetime), price ascending. */
    products: sortedProducts as Product[],
    /** True until the first product fetch completes (success or fail). */
    productsLoading,
    /** True while a purchase sheet round-trip is in flight. */
    purchasing,
    purchase,
    /** One-time purchase (Pro Lifetime) — type 'in-app'. */
    purchaseInApp,
    restore,
    finishTransaction,
  };
}
