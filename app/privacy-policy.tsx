import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../components/Screen';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  return (
    <Screen>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.body}>
        This flight simulator is built to respect your privacy. Here is what it does and does not
        do.
      </Text>
      <Text style={styles.heading}>What stays on your device</Text>
      <Text style={styles.body}>
        Your Pro status, your last flight setup, and your flight log are stored only on your
        device. They are never sent to us.
      </Text>
      <Text style={styles.heading}>What we do not collect</Text>
      <Text style={styles.body}>
        We do not collect your name, email, location, contacts, or photos. We run no ads and no
        third-party trackers. There are no accounts in this version.
      </Text>
      <Text style={styles.heading}>Purchases</Text>
      <Text style={styles.body}>
        Pro purchases are handled entirely by Apple (App Store) or Google (Google Play). We never
        see your payment details. Restoring a purchase reads only the store receipt on your
        device.
      </Text>
      <Text style={styles.heading}>Changes</Text>
      <Text style={styles.body}>
        If this policy changes, the new version will appear here in the app.
      </Text>
      <Text style={styles.body}>Questions? Email us at contact@beatrackfam.info</Text>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Back</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#F8FAFC', fontSize: 28, fontWeight: '800', marginTop: 8 },
  heading: { color: '#F8FAFC', fontSize: 17, fontWeight: '800', marginTop: 20 },
  body: { color: '#CBD5E1', fontSize: 15, lineHeight: 22, marginTop: 8 },
  backBtn: { alignItems: 'center', marginTop: 24, paddingVertical: 10 },
  backBtnText: { color: '#38BDF8', fontSize: 15, fontWeight: '700' },
});
