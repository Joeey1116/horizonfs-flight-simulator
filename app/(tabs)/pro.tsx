import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { isPro, setPro } from '../../src/lib/pro';
import { LIFETIME_SKU, SKU_NAMES, SUB_SKUS, usePro } from '../../src/lib/purchases';
import { AIRCRAFT } from '../../src/data/catalog';

const BENEFITS = [
  'All 27 aircraft, including the 747, A380, and Concorde',
  'Every airport in the catalog — 140 and growing',
  'No limits on flights or flight-log exports',
  'New aircraft and airports first, in every update',
];

/**
 * Pro upgrade screen. Plans come from the store when the products exist
 * (see lib/purchases.ts); until then the placeholder plans below are
 * shown with a clear note. Prices are placeholders until Joey sets them
 * in App Store Connect / Play Console.
 */
export default function ProScreen() {
  const { subscriptions, products, productsLoading, purchasing, purchase, purchaseInApp, restore } =
    usePro();
  const [owned, setOwned] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    isPro().then(setOwned);
  }, []);

  const storePlans = [...subscriptions, ...products];
  const hasStorePlans = storePlans.length > 0;

  async function buy(sku: string, isSub: boolean) {
    const ok = isSub ? await purchase(sku) : await purchaseInApp(sku);
    if (ok) {
      setOwned(true);
      Alert.alert('Welcome to Pro', 'Every aircraft and airport is now unlocked. Enjoy the skies.');
    } else {
      Alert.alert('Purchase did not complete', 'No charge was made. Try again when you are ready.');
    }
  }

  async function doRestore() {
    setRestoring(true);
    const ok = await restore();
    setRestoring(false);
    if (ok) {
      setOwned(true);
      Alert.alert('Restored', 'Your Pro purchase was found and restored.');
    } else {
      Alert.alert('Nothing to restore', 'No Pro purchase was found on this store account.');
    }
  }

  return (
    <Screen>
      <Text style={styles.kicker}>PRO</Text>
      <Text style={styles.title}>Fly everything.</Text>
      <Text style={styles.sub}>
        Free flies 8 aircraft from any airport. Pro unlocks the whole fleet — every widebody,
        every legend, every airport.
      </Text>

      {owned ? (
        <View style={styles.ownedBox}>
          <Text style={styles.ownedText}>✓ You have Pro — thank you! Everything is unlocked.</Text>
        </View>
      ) : null}

      <View style={styles.benefits}>
        {BENEFITS.map((b) => (
          <Text key={b} style={styles.benefit}>
            ✓ {b}
          </Text>
        ))}
      </View>

      {productsLoading ? (
        <ActivityIndicator color="#38BDF8" style={{ marginTop: 24 }} />
      ) : hasStorePlans ? (
        <View style={styles.plans}>
          {storePlans.map((p) => {
            // react-native-iap 17.0.1: products carry `id` + `displayPrice`
            // (not productId/localizedPrice); `type: 'subs'` marks a
            // subscription. Matches Motivation's usage (displayPrice).
            const isSub = p.type === 'subs';
            return (
              <Pressable
                key={p.id}
                style={styles.plan}
                disabled={purchasing || owned}
                onPress={() => buy(p.id, isSub)}
              >
                <Text style={styles.planName}>{p.title || SKU_NAMES[p.id] || p.id}</Text>
                <Text style={styles.planPrice}>{p.displayPrice}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.plans}>
          <Text style={styles.placeholderNote}>
            Store products are not set up yet — prices will appear here once they are. Planned
            plans:
          </Text>
          {[
            { name: 'Pro Monthly', price: '$4.99 / month', sku: SUB_SKUS[0], sub: true },
            { name: 'Pro Yearly', price: '$29.99 / year', sku: SUB_SKUS[1], sub: true },
            { name: 'Pro Lifetime', price: '$49.99 once', sku: LIFETIME_SKU, sub: false },
          ].map((plan) => (
            <Pressable
              key={plan.sku}
              style={styles.plan}
              disabled={purchasing || owned}
              onPress={() => buy(plan.sku, plan.sub)}
            >
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price} *</Text>
            </Pressable>
          ))}
          <Text style={styles.placeholderNote}>* Placeholder price — set in the store.</Text>
        </View>
      )}

      <Pressable style={styles.restoreBtn} onPress={doRestore} disabled={restoring}>
        <Text style={styles.restoreText}>
          {restoring ? 'Restoring…' : 'Restore purchases'}
        </Text>
      </Pressable>

      <Text style={styles.fine}>
        {AIRCRAFT.filter((a) => a.pro).length} Pro aircraft · cancel anytime in your store
        subscriptions · purchases restore on any device with the same store account.
      </Text>

      {/* Testing-only Pro preview: remove before release. Lets Joey fly
          Pro aircraft on a device before store products exist. */}
      <Pressable
        style={styles.debugBtn}
        onPress={async () => {
          const next = !owned;
          await setPro(next);
          setOwned(next);
        }}
      >
        <Text style={styles.debugText}>
          [Testing only — remove before release] {owned ? 'Turn off Pro preview' : 'Preview Pro'}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: '#FDE68A', fontSize: 12, fontWeight: '800', letterSpacing: 2, marginTop: 8 },
  title: { color: '#F8FAFC', fontSize: 30, fontWeight: '800', marginTop: 4 },
  sub: { color: '#94A3B8', fontSize: 15, lineHeight: 22, marginTop: 6 },
  ownedBox: {
    backgroundColor: '#14532D',
    borderRadius: 12,
    marginTop: 18,
    padding: 14,
  },
  ownedText: { color: '#86EFAC', fontSize: 14, fontWeight: '700' },
  benefits: { gap: 10, marginTop: 20 },
  benefit: { color: '#E2E8F0', fontSize: 15, lineHeight: 21 },
  plans: { gap: 10, marginTop: 24 },
  plan: {
    alignItems: 'center',
    backgroundColor: '#0C1626',
    borderColor: '#38BDF8',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  planName: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  planPrice: { color: '#7DD3FC', fontSize: 15, fontWeight: '800' },
  placeholderNote: { color: '#64748B', fontSize: 13, lineHeight: 18 },
  restoreBtn: { alignItems: 'center', marginTop: 20, paddingVertical: 10 },
  restoreText: { color: '#38BDF8', fontSize: 15, fontWeight: '700' },
  fine: { color: '#64748B', fontSize: 12, lineHeight: 17, marginTop: 16, textAlign: 'center' },
  debugBtn: {
    alignItems: 'center',
    borderColor: '#7C3AED',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 24,
    paddingVertical: 10,
  },
  debugText: { color: '#C4B5FD', fontSize: 12 },
});
