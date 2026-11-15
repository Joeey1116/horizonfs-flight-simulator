import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { freeAircraft, getAirportByIcao } from '../../src/data/catalog';
import { isPro } from '../../src/lib/pro';

export default function AirportDetailScreen() {
  const router = useRouter();
  const { icao } = useLocalSearchParams<{ icao?: string }>();
  const airport = getAirportByIcao(icao ?? '');
  const [pro, setPro] = useState(false);
  const [aircraftId, setAircraftId] = useState('c172');

  useEffect(() => {
    isPro().then(setPro);
  }, []);

  if (!airport) {
    return (
      <Screen>
        <Text style={styles.title}>Airport not found</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </Screen>
    );
  }

  const aircraft = freeAircraft();
  const selected = aircraft.find((a) => a.id === aircraftId) ?? aircraft[0];
  const runway = airport.runways[0];

  function fly() {
    if (!selected || !runway || !airport) return;
    router.push({
      pathname: '/flight',
      params: { aircraft: selected.id, airport: airport.icao, runway: runway.ident },
    });
  }

  return (
    <Screen>
      <Text style={styles.icao}>{airport.icao}</Text>
      <Text style={styles.title}>{airport.name}</Text>
      <Text style={styles.sub}>
        {airport.city}, {airport.country} · {airport.iata} ·{' '}
        {airport.elevationFt.toLocaleString()} ft elevation
      </Text>

      <Text style={styles.sectionTitle}>Runways</Text>
      {airport.runways.map((r) => (
        <View key={r.ident} style={styles.runwayRow}>
          <Text style={styles.runwayIdent}>{r.ident}</Text>
          <Text style={styles.runwayDetail}>
            {r.lengthFt.toLocaleString()} ft · heading {r.headingDeg}° · {r.surface}
          </Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Fly from here with</Text>
      <View style={styles.chips}>
        {aircraft.map((a) => (
          <Pressable
            key={a.id}
            style={[styles.chip, aircraftId === a.id ? styles.chipOn : null]}
            onPress={() => setAircraftId(a.id)}
          >
            <Text style={[styles.chipText, aircraftId === a.id ? styles.chipTextOn : null]}>
              {a.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.note}>
        Free aircraft shown here. Pro unlocks {pro ? 'all' : '19 more'} aircraft — see the Pro
        tab.
      </Text>

      <Pressable style={styles.flyBtn} onPress={fly}>
        <Text style={styles.flyBtnText}>✈ Fly from {airport.icao}</Text>
      </Pressable>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Back to airports</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  icao: { color: '#7DD3FC', fontSize: 15, fontWeight: '800', letterSpacing: 2, marginTop: 8 },
  title: { color: '#F8FAFC', fontSize: 26, fontWeight: '800', marginTop: 4 },
  sub: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  sectionTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '800', marginTop: 22 },
  runwayRow: {
    alignItems: 'center',
    backgroundColor: '#0C1626',
    borderColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 8,
    padding: 12,
  },
  runwayIdent: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', width: 56 },
  runwayDetail: { color: '#94A3B8', fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    backgroundColor: '#0C1626',
    borderColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  chipText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  chipTextOn: { color: '#FFFFFF' },
  note: { color: '#64748B', fontSize: 13, marginTop: 10 },
  flyBtn: {
    alignItems: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 12,
    marginTop: 20,
    paddingVertical: 14,
  },
  flyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  backBtn: { alignItems: 'center', marginTop: 14, paddingVertical: 10 },
  backBtnText: { color: '#38BDF8', fontSize: 15, fontWeight: '700' },
});
