import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Airport } from '../src/data/types';

export function AirportRow({
  airport,
  onPress,
}: {
  airport: Airport;
  onPress: () => void;
}) {
  const runway = airport.runways[0];
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.icaoBox}>
        <Text style={styles.icao}>{airport.icao}</Text>
        <Text style={styles.iata}>{airport.iata}</Text>
      </View>
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {airport.name}
        </Text>
        <Text style={styles.sub}>
          {airport.city}, {airport.country}
          {runway ? ` · RWY ${runway.ident} · ${runway.lengthFt.toLocaleString()} ft` : ''}
        </Text>
      </View>
      {airport.featured ? (
        <View style={styles.star}>
          <Text style={styles.starText}>★</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: '#0C1626',
    borderColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 12,
  },
  icaoBox: { alignItems: 'center', width: 64 },
  icao: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  iata: { color: '#64748B', fontSize: 12 },
  main: { flex: 1, marginLeft: 10 },
  name: { color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
  sub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  star: { marginLeft: 8 },
  starText: { color: '#FDE68A', fontSize: 16 },
});
