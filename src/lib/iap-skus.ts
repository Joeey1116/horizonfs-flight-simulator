/**
 * Pro product IDs (SKUs) — shared by the native IAP module and the
 * web-safe wrapper. Kept in its own file so neither side needs to import
 * react-native-iap just for the constants.
 *
 * TODO — BEFORE ANY STORE SUBMISSION: Joey must create these exact
 * product IDs in App Store Connect and Google Play Console, then replace
 * the placeholder SKUs below. Until then every purchase attempt fails
 * gracefully (no products to fetch) and Pro stays locked — nothing is
 * granted without a verified transaction.
 */
import { Platform } from 'react-native';

// iOS: create these exact IDs in App Store Connect (TODO).
const IOS_SUB_SKUS = ['HORIZONFS_PRO_MONTHLY', 'HORIZONFS_PRO_YEARLY'];
// Android: Joey to provide from Play Console after uploading a build
// with billing (TODO).
const ANDROID_SUB_SKUS = ['horizonfs_pro_monthly', 'horizonfs_pro_yearly'];

export const SUB_SKUS = Platform.OS === 'ios' ? IOS_SUB_SKUS : ANDROID_SUB_SKUS;

// One-time: Pro forever, pay once.
const IOS_IAP_SKUS = ['HORIZONFS_PRO_LIFETIME'];
const ANDROID_IAP_SKUS = ['horizonfs_pro_lifetime'];

export const IAP_SKUS = Platform.OS === 'ios' ? IOS_IAP_SKUS : ANDROID_IAP_SKUS;

export const LIFETIME_SKU =
  Platform.OS === 'ios' ? 'HORIZONFS_PRO_LIFETIME' : 'horizonfs_pro_lifetime';

/** Friendly plan names per SKU (fallback when the store gives no title). */
export const SKU_NAMES: Record<string, string> = {
  HORIZONFS_PRO_MONTHLY: 'Pro Monthly',
  HORIZONFS_PRO_YEARLY: 'Pro Yearly',
  HORIZONFS_PRO_LIFETIME: 'Pro Lifetime',
  horizonfs_pro_monthly: 'Pro Monthly',
  horizonfs_pro_yearly: 'Pro Yearly',
  horizonfs_pro_lifetime: 'Pro Lifetime',
};
