import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { AirportRow } from '../../components/AirportRow';
import { AIRPORTS, searchAirports } from '../../src/data/catalog';

export default function AirportsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const list = useMemo(() => {
    let out = searchAirports(query);
    if (featuredOnly) out = out.filter((a) => a.featured);
    return out;
  }, [query, featuredOnly]);

  return (
    <Screen>
      <Text style={styles.title}>Airports</Text>
      <Text style={styles.sub}>
        {AIRPORTS.length} airports · real ICAO data · longest runways listed
      </Text>
      <TextInput
        style={styles.search}
        placeholder="Search ICAO, IATA, city or name…"
        placeholderTextColor="#64748B"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <Pressable
        style={[styles.toggle, featuredOnly ? styles.toggleOn : null]}
        onPress={() => setFeaturedOnly((v) => !v)}
      >
        <Text style={[styles.toggleText, featuredOnly ? styles.toggleTextOn : null]}>
          ★ Major hubs only
        </Text>
      </Pressable>
      {list.length === 0 ? (
        <Text style={styles.empty}>No airports match that search.</Text>
      ) : (
        list.map((a) => (
          <AirportRow
            key={a.icao}
            airport={a}
            onPress={() => router.push({ pathname: '/airport/[icao]', params: { icao: a.icao } })}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#F8FAFC', fontSize: 28, fontWeight: '800', marginTop: 8 },
  sub: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  search: {
    backgroundColor: '#0C1626',
    borderColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    color: '#F8FAFC',
    fontSize: 15,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  toggle: {
    alignSelf: 'flex-start',
    backgroundColor: '#0C1626',
    borderColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  toggleOn: { backgroundColor: '#713F12', borderColor: '#D97706' },
  toggleText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  toggleTextOn: { color: '#FDE68A' },
  empty: { color: '#64748B', fontSize: 14, marginTop: 24, textAlign: 'center' },
});
