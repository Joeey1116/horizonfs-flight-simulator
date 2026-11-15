import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Aircraft } from '../src/data/types';
import { CATEGORY_LABELS } from '../src/data/types';

export function AircraftCard({
  aircraft,
  onPress,
}: {
  aircraft: Aircraft;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.stripe, { backgroundColor: aircraft.liveryColor }]} />
        <View style={styles.main}>
          <Text style={styles.name}>{aircraft.name}</Text>
          <Text style={styles.sub}>
            {aircraft.manufacturer} · {CATEGORY_LABELS[aircraft.category]}
          </Text>
          <Text style={styles.specs}>
            {aircraft.cruiseSpeedKt} kt cruise · {aircraft.rangeNmi.toLocaleString()} nmi ·{' '}
            {aircraft.seats} seats
          </Text>
        </View>
        <View style={[styles.badge, aircraft.pro ? styles.proBadge : styles.freeBadge]}>
          <Text style={[styles.badgeText, aircraft.pro ? styles.proText : styles.freeText]}>
            {aircraft.pro ? 'PRO' : 'FREE'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0C1626',
    borderColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  row: { alignItems: 'center', flexDirection: 'row' },
  stripe: { borderRadius: 3, height: 44, width: 6 },
  main: { flex: 1, marginLeft: 12 },
  name: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  sub: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  specs: { color: '#64748B', fontSize: 12, marginTop: 4 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  freeBadge: { backgroundColor: '#14532D' },
  proBadge: { backgroundColor: '#713F12' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  freeText: { color: '#86EFAC' },
  proText: { color: '#FDE68A' },
});
