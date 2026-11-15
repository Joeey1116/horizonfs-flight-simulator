import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { featuredAirports, getAircraftById } from '../../src/data/catalog';
import { CATEGORY_LABELS } from '../../src/data/types';
import { isPro } from '../../src/lib/pro';

export default function AircraftDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const aircraft = getAircraftById(id ?? '');
  const [pro, setPro] = useState(false);
  const [airportIcao, setAirportIcao] = useState('KJFK');

  useEffect(() => {
    isPro().then(setPro);
  }, []);

  if (!aircraft) {
    return (
      <Screen>
        <Text style={styles.title}>Aircraft not found</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </Screen>
    );
  }

  const airports = featuredAirports().slice(0, 6);
  const airport = airports.find((a) => a.icao === airportIcao) ?? airports[0];
  const runway = airport?.runways[0];
  const locked = aircraft.pro && !pro;

  function fly() {
    if (locked) {
      router.push('/(tabs)/pro');
      return;
    }
    if (!aircraft || !airport || !runway) return;
    router.push({
      pathname: '/flight',
      params: { aircraft: aircraft.id, airport: airport.icao, runway: runway.ident },
    });
  }

  return (
    <Screen>
      <View style={[styles.stripe, { backgroundColor: aircraft.liveryColor }]} />
      <Text style={styles.title}>{aircraft.name}</Text>
      <Text style={styles.sub}>
        {aircraft.manufacturer} · {CATEGORY_LABELS[aircraft.category]} · first flown{' '}
        {aircraft.firstFlight}
      </Text>
      <Text style={styles.description}>{aircraft.description}</Text>

      <View style={styles.specs}>
        <Spec label="Cruise" value={`${aircraft.cruiseSpeedKt} kt`} />
        <Spec label="Max speed" value={`${aircraft.maxSpeedKt} kt`} />
        <Spec label="Range" value={`${aircraft.rangeNmi.toLocaleString()} nmi`} />
        <Spec label="Seats" value={`${aircraft.seats}`} />
        <Spec label="MTOW" value={`${aircraft.mtowLb.toLocaleString()} lb`} />
        <Spec label="Rotation" value={`${aircraft.rotationKt} kt`} />
        <Spec label="Stall" value={`${aircraft.stallKt} kt`} />
        <Spec label="Ceiling" value={`${aircraft.serviceCeilingFt.toLocaleString()} ft`} />
      </View>
      <Text style={styles.engines}>{aircraft.engines}</Text>
      <Text style={styles.livery}>
        Livery: {aircraft.livery} · {aircraft.pro ? 'Pro aircraft' : 'Free aircraft'}
      </Text>

      <Text style={styles.sectionTitle}>Depart from</Text>
      <View style={styles.chips}>
        {airports.map((a) => (
          <Pressable
            key={a.icao}
            style={[styles.chip, airportIcao === a.icao ? styles.chipOn : null]}
            onPress={() => setAirportIcao(a.icao)}
          >
            <Text style={[styles.chipText, airportIcao === a.icao ? styles.chipTextOn : null]}>
              {a.icao}
            </Text>
          </Pressable>
        ))}
      </View>
      {runway ? (
        <Text style={styles.runwayNote}>
          Runway {runway.ident} · {runway.lengthFt.toLocaleString()} ft · {airport?.name}
        </Text>
      ) : null}

      <Pressable style={[styles.flyBtn, locked ? styles.proBtn : null]} onPress={fly}>
        <Text style={styles.flyBtnText}>
          {locked ? '🔒 Unlock with Pro to fly' : `✈ Fly the ${aircraft.name}`}
        </Text>
      </Pressable>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Back to aircraft</Text>
      </Pressable>
    </Screen>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.spec}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stripe: { borderRadius: 4, height: 8, marginTop: 8, width: 64 },
  title: { color: '#F8FAFC', fontSize: 28, fontWeight: '800', marginTop: 12 },
  sub: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  description: { color: '#E2E8F0', fontSize: 15, lineHeight: 22, marginTop: 12 },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  spec: {
    backgroundColor: '#0C1626',
    borderColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '47%',
    padding: 12,
  },
  specLabel: { color: '#7DD3FC', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  specValue: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginTop: 4 },
  engines: { color: '#94A3B8', fontSize: 13, marginTop: 16 },
  livery: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  sectionTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '800', marginTop: 22 },
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
  chipText: { color: '#94A3B8', fontSize: 14, fontWeight: '700' },
  chipTextOn: { color: '#FFFFFF' },
  runwayNote: { color: '#64748B', fontSize: 13, marginTop: 10 },
  flyBtn: {
    alignItems: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 12,
    marginTop: 20,
    paddingVertical: 14,
  },
  proBtn: { backgroundColor: '#713F12' },
  flyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  backBtn: { alignItems: 'center', marginTop: 14, paddingVertical: 10 },
  backBtnText: { color: '#38BDF8', fontSize: 15, fontWeight: '700' },
});
