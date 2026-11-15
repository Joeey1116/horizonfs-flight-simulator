import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { AircraftCard } from '../../components/AircraftCard';
import { AIRCRAFT, searchAircraft } from '../../src/data/catalog';
import { CATEGORY_LABELS, type AircraftCategory } from '../../src/data/types';

const FILTERS: Array<'all' | AircraftCategory> = [
  'all',
  'ga',
  'regional',
  'narrowbody',
  'widebody',
  'legend',
];

export default function AircraftScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | AircraftCategory>('all');

  const list = useMemo(() => {
    let out = searchAircraft(query);
    if (filter !== 'all') out = out.filter((a) => a.category === filter);
    return out;
  }, [query, filter]);

  const freeCount = AIRCRAFT.filter((a) => !a.pro).length;

  return (
    <Screen>
      <Text style={styles.title}>Aircraft</Text>
      <Text style={styles.sub}>
        {AIRCRAFT.length} aircraft · {freeCount} free · the rest with Pro
      </Text>
      <TextInput
        style={styles.search}
        placeholder="Search aircraft or maker…"
        placeholderTextColor="#64748B"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[styles.chip, filter === f ? styles.chipOn : null]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f ? styles.chipTextOn : null]}>
              {f === 'all' ? 'All' : CATEGORY_LABELS[f]}
            </Text>
          </Pressable>
        ))}
      </View>
      {list.length === 0 ? (
        <Text style={styles.empty}>No aircraft match that search.</Text>
      ) : (
        list.map((a) => (
          <AircraftCard
            key={a.id}
            aircraft={a}
            onPress={() => router.push({ pathname: '/aircraft/[id]', params: { id: a.id } })}
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 16 },
  chip: {
    backgroundColor: '#0C1626',
    borderColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipOn: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  chipText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: '#FFFFFF' },
  empty: { color: '#64748B', fontSize: 14, marginTop: 24, textAlign: 'center' },
});
