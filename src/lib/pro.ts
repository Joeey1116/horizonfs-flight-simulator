/**
 * Pro entitlement — the local source of truth for the Pro upgrade.
 *
 * The store (App Store / Google Play) is the real authority; this module
 * only remembers the granted state on-device. lib/purchases.ts mirrors
 * the Motivation app's react-native-iap pattern and calls setPro() when
 * a verified transaction comes back. Until store products exist, Pro is
 * granted only through the debug toggle on the Pro screen (clearly
 * labelled) — never silently.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRO_KEY = '@horizonfs/pro-v1';
const LAST_SETUP_KEY = '@horizonfs/last-setup-v1';

export interface LastSetup {
  aircraftId: string;
  airportIcao: string;
  runwayIdent: string;
}

export async function isPro(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PRO_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setPro(value: boolean): Promise<void> {
  try {
    if (value) await AsyncStorage.setItem(PRO_KEY, '1');
    else await AsyncStorage.removeItem(PRO_KEY);
  } catch {
    // Storage failure: Pro stays as-is; the purchase flow reports it.
  }
}

export async function getLastSetup(): Promise<LastSetup | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_SETUP_KEY);
    return raw ? (JSON.parse(raw) as LastSetup) : null;
  } catch {
    return null;
  }
}

export async function saveLastSetup(setup: LastSetup): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SETUP_KEY, JSON.stringify(setup));
  } catch {
    // Non-fatal: the home screen just falls back to the default flight.
  }
}
