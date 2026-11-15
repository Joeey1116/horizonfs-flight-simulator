import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({
  children,
  refreshControl,
}: {
  children: ReactNode;
  refreshControl?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          Platform.OS === 'web' ? styles.contentWeb : null,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl as any}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050914' },
  scroll: { flex: 1, backgroundColor: '#050914' },
  // Bottom padding clears the tab bar (~90px) so the last element never
  // slides underneath it.
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  // Web-only: expo-router's NativeTabs renders the tab bar as a fixed pill
  // at the TOP of the viewport on web (on iOS/Android it is the native
  // bottom bar), so content needs top clearance or the title hides behind
  // it. Native layout is untouched.
  contentWeb: { paddingTop: 72 },
});
