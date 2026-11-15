import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';

// Global JS error handler: in release builds a fatal error would otherwise
// kill the app silently. Showing the message lets us diagnose from a
// screenshot instead of guessing. (Copied from the proven Snugbug setup.)
const _g = globalThis as any;
if (!_g.__btrErrorHandlerInstalled) {
  _g.__btrErrorHandlerInstalled = true;
  const show = (title: string, message: string) => {
    try {
      Alert.alert(title, message.slice(0, 500));
    } catch {
      // Last resort — the error is still logged.
    }
  };
  const prev = _g.ErrorUtils?.getGlobalHandler?.();
  _g.ErrorUtils?.setGlobalHandler?.((error: any, isFatal?: boolean) => {
    if (isFatal) {
      const msg = error?.message ?? String(error);
      const stack = error?.stack ? `\n${String(error.stack).split('\n').slice(0, 4).join('\n')}` : '';
      show('Something broke', `${msg}${stack}\n\nPlease screenshot this and send it to Joey.`);
    }
    try {
      prev?.(error, isFatal);
    } catch {}
  });
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#050914' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="flight" />
        <Stack.Screen name="aircraft/[id]" />
        <Stack.Screen name="airport/[icao]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="privacy-policy" />
      </Stack>
    </>
  );
}
