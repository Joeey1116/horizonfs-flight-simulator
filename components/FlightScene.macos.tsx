import { StyleSheet, Text, View } from 'react-native';
import type { MutableRefObject } from 'react';
import type { FlightSetup } from '../src/engine/flight';
import type {
  FlightControls,
  FlightEvent,
  FlightState,
  HudData,
} from '../src/engine/flight';

/**
 * macOS variant of the 3D flight scene — Metro resolves this file
 * instead of FlightScene.tsx for platform === 'macos'; iOS/Android/web
 * are untouched.
 *
 * The real scene is react-three-fiber + three.js rendered through
 * expo-gl's GLView, which has no react-native-macos build (and whose
 * iOS GLView carries a known on-device crash — out of scope here; this
 * file does NOT change the iOS scene in any way). The Mac build
 * therefore shows an honest placeholder in the flight screen: the
 * rest of the app (fleet, airports, flight log, HUD shell and
 * controls around this view) is fully present, but the 3D view itself
 * does not render on macOS yet. Because this variant never imports
 * expo-gl / three / @react-three/fiber, none of them enter the Mac
 * bundle's module graph.
 *
 * The export keeps the exact FlightScene signature so app/flight.tsx
 * needs no platform branches.
 */
export function FlightScene({
  setup,
}: {
  setup: FlightSetup;
  controlsRef: MutableRefObject<FlightControls>;
  paused: boolean;
  stateRef: MutableRefObject<FlightState>;
  onHud: (hud: HudData) => void;
  onEvent: (event: FlightEvent) => void;
}) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>3D flight view isn't available on Mac yet</Text>
      <Text style={styles.body}>
        {setup.aircraft.name} · {setup.airport.icao} · Runway {setup.runway.ident}
      </Text>
      <Text style={styles.body}>
        The 3D view runs on iPhone, iPad and Android. On Mac you can still
        browse the full fleet and airport catalog and review your flight log.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C1B33',
    paddingHorizontal: 32,
    gap: 10,
  },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  body: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
