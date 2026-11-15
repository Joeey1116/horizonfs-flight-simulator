/**
 * In-app purchases — Pro upgrade. WEB-SAFE entry point.
 *
 * Why the split: react-native-iap throws when its module is EVALUATED on
 * web, which poisons every route that imports it — and, worse, every
 * navigator that CONTAINS such a route (the tabs navigator loads all four
 * tab routes to build its descriptors, so one broken Pro tab crashed the
 * whole home screen in the web preview, Nov 15 2026). The native hook
 * lives in ./purchases-native.ts and is lazy-required ONLY on iOS/Android
 * below; Metro includes that module in the web bundle but never evaluates
 * it there, because this branch never runs on web. Do NOT "fix" this by
 * adding a .web.ts shim — Metro does not reliably resolve .web.ts files
 * for Expo web (family lesson, Oct 2026).
 *
 * On web, usePro() returns a static no-op: no products, every purchase
 * attempt resolves false, restore finds nothing. Pro on web is out of
 * scope for v1 — the store sheets only exist on device anyway.
 */
import { Platform } from 'react-native';
import { IAP_SKUS, LIFETIME_SKU, SKU_NAMES, SUB_SKUS } from './iap-skus';
import type { useProNative } from './purchases-native';
import type { Product, ProductSubscription } from 'react-native-iap';

export { IAP_SKUS, LIFETIME_SKU, SKU_NAMES, SUB_SKUS };
export type { Product, ProductSubscription };

export type ProHookResult = ReturnType<typeof useProNative>;

/** Static no-op result used on web (no store, no products, no grants). */
const WEB_PRO: ProHookResult = {
  subscriptions: [],
  products: [],
  productsLoading: false,
  purchasing: false,
  purchase: async () => false,
  purchaseInApp: async () => false,
  restore: async () => false,
  finishTransaction: async () => {},
};

export function usePro(): ProHookResult {
  if (Platform.OS === 'web') {
    return WEB_PRO;
  }
  // Platform.OS is a build-time constant per bundle (always 'web' in the
  // web bundle, never 'web' on device), so the hook call order is stable
  // within any given bundle — this conditional call is safe in practice.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useProNative: useProNativeHook } = require('./purchases-native') as {
    useProNative: typeof useProNative;
  };
  return useProNativeHook();
}
