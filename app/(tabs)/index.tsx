import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { AircraftCard } from '../../components/AircraftCard';
import { AirportRow } from '../../components/AirportRow';
import {
  DEFAULT_AIRCRAFT_ID,
  DEFAULT_AIRPORT_ICAO,
  featuredAirports,
  freeAircraft,
  getAircraftById,
  getAirportByIcao,
} from '../../src/data/catalog';
import { getLastSetup, type LastSetup } from '../../src/lib/pro';

export default function HomeScreen() {
  const router = useRouter();
  const [last, setLast] = useState<LastSetup | null>(null);

  useEffect(() => {
    getLastSetup().then(setLast);
  }, []);

  const aircraft = getAircraftById(last?.aircraftId ?? DEFAULT_AIRCRAFT_ID);
  const airport = getAirportByIcao(last?.airportIcao ?? DEFAULT_AIRPORT_ICAO);
  const runway = airport?.runways.find((r) => r.ident === last?.runwayIdent) ?? airport?.runways[0];
  const featured = featuredAirports().slice(0, 5);
  const free = freeAircraft().slice(0, 3);

  function flyNow() {
    if (!aircraft || !airport || !runway) return;
    router.push({
      pathname: '/flight',
      params: { aircraft: aircraft.id, airport: airport.icao, runway: runway.ident },
    });
  }

  return (
    <Screen>
      <Text style={styles.kicker}>HORIZONFS</Text>
      <Text style={styles.title}>Where to next?</Text>
      <Text style={styles.sub}>
        {freeAircraft().length} free aircraft · {featuredAirports().length} major airports · real
        flight physics
      </Text>

      <View style={styles.quickCard}>
        <Text style={styles.quickLabel}>QUICK FLIGHT</Text>
        <Text style={styles.quickRoute}>
          {airport?.icao} → {aircraft?.name}
        </Text>
        <Text style={styles.quickDetail}>
          {airport?.name} · Runway {runway?.ident} · {runway?.lengthFt.toLocaleString()} ft
        </Text>
        <Pressable style={styles.flyButton} onPress={flyNow}>
          <Text style={styles.flyButtonText}>✈ Fly now</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Major airports</Text>
        <Link href="/(tabs)/airports" style={styles.sectionLink}>
          See all
        </Link>
      </View>
      {featured.map((a) => (
        <AirportRow
          key={a.icao}
          airport={a}
          onPress={() => router.push({ pathname: '/airport/[icao]', params: { icao: a.icao } })}
        />
      ))}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Free aircraft</Text>
        <Link href="/(tabs)/aircraft" style={styles.sectionLink}>
          See all
        </Link>
      </View>
      {free.map((a) => (
        <AircraftCard
          key={a.id}
          aircraft={a}
          onPress={() => router.push({ pathname: '/aircraft/[id]', params: { id: a.id } })}
        />
      ))}

      <Pressable style={styles.settingsLink} onPress={() => router.push('/settings')}>
        <Text style={styles.settingsLinkText}>Settings · Privacy · Flight log</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: '#7DD3FC', fontSize: 12, fontWeight: '800', letterSpacing: 2, marginTop: 8 },
  title: { color: '#F8FAFC', fontSize: 30, fontWeight: '800', marginTop: 4 },
  sub: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  quickCard: {
    backgroundColor: '#0C1B33',
    borderColor: '#1E3A5F',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
    padding: 18,
  },
  quickLabel: { color: '#7DD3FC', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  quickRoute: { color: '#F8FAFC', fontSize: 20, fontWeight: '800', marginTop: 6 },
  quickDetail: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  flyButton: {
    alignItems: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 12,
    marginTop: 14,
    paddingVertical: 13,
  },
  flyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  sectionHead: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 24,
  },
  sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  sectionLink: { color: '#38BDF8', fontSize: 14, fontWeight: '600' },
  settingsLink: { alignItems: 'center', marginTop: 8, paddingVertical: 12 },
  settingsLinkText: { color: '#64748B', fontSize: 13 },
});
