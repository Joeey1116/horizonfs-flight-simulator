import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../components/Screen';
import { isPro } from '../src/lib/pro';
import { usePro } from '../src/lib/purchases';
import { exportFlightLogJson, getFlightRecords, type FlightRecord } from '../src/lib/logbook';

export default function SettingsScreen() {
  const router = useRouter();
  const { restore } = usePro();
  const [pro, setPro] = useState(false);
  const [records, setRecords] = useState<FlightRecord[]>([]);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    isPro().then(setPro);
    getFlightRecords().then(setRecords);
  }, []);

  async function doRestore() {
    setRestoring(true);
    const ok = await restore();
    setRestoring(false);
    if (ok) {
      setPro(true);
      Alert.alert('Restored', 'Your Pro purchase was found and restored.');
    } else {
      Alert.alert('Nothing to restore', 'No Pro purchase was found on this store account.');
    }
  }

  async function showExport() {
    const json = await exportFlightLogJson();
    Alert.alert(
      'Flight log export',
      records.length === 0
        ? 'No flights logged yet. Fly once and it will appear here.'
        : `${records.length} flight(s) logged. Export JSON is ready — copy it from the log file in the next update.`,
    );
    void json;
  }

  return (
    <Screen>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pro status</Text>
        <Text style={styles.cardText}>{pro ? 'Pro — everything unlocked.' : 'Free plan.'}</Text>
        <Pressable style={styles.linkBtn} onPress={() => router.push('/(tabs)/pro')}>
          <Text style={styles.linkText}>{pro ? 'Manage Pro' : 'Get Pro'}</Text>
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={doRestore} disabled={restoring}>
          <Text style={styles.linkText}>{restoring ? 'Restoring…' : 'Restore purchases'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Flight log</Text>
        <Text style={styles.cardText}>
          Every completed flight is saved on this device and shaped for import into the companion Flight Journal
          pilot-logbook app.
        </Text>
        {records.length === 0 ? (
          <Text style={styles.empty}>No flights logged yet.</Text>
        ) : (
          records.slice(0, 10).map((r, i) => (
            <Text key={`${r.date}-${i}`} style={styles.record}>
              {r.date} · {r.aircraftName} · {r.departureIcao} · {r.flightMinutes} min ·{' '}
              {r.landings} landing(s) · {r.outcome}
            </Text>
          ))
        )}
        <Pressable style={styles.linkBtn} onPress={showExport}>
          <Text style={styles.linkText}>Export flight log (JSON)</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <Text style={styles.cardText}>
          A mobile flight simulator. Free with a Pro upgrade. 27 aircraft, 140 airports, real
          flight physics.
        </Text>
        <Text style={styles.cardText}>Version 1.0.0 (build 1000)</Text>
        <Pressable style={styles.linkBtn} onPress={() => router.push('/privacy-policy')}>
          <Text style={styles.linkText}>Privacy policy</Text>
        </Pressable>
      </View>

      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Back</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#F8FAFC', fontSize: 28, fontWeight: '800', marginTop: 8 },
  card: {
    backgroundColor: '#0C1626',
    borderColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  cardTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '800' },
  cardText: { color: '#94A3B8', fontSize: 14, lineHeight: 20, marginTop: 6 },
  empty: { color: '#64748B', fontSize: 13, marginTop: 10 },
  record: { color: '#E2E8F0', fontSize: 13, lineHeight: 19, marginTop: 6 },
  linkBtn: { marginTop: 12 },
  linkText: { color: '#38BDF8', fontSize: 15, fontWeight: '700' },
  backBtn: { alignItems: 'center', marginTop: 18, paddingVertical: 10 },
  backBtnText: { color: '#38BDF8', fontSize: 15, fontWeight: '700' },
});
