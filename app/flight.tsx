import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlightScene } from '../components/FlightScene';
import { FlightControls } from '../components/FlightControls';
import { Hud } from '../components/Hud';
import { getAircraftById, getAirportByIcao } from '../src/data/catalog';
import {
  createFlight,
  toHud,
  type FlightControls as Controls,
  type FlightEvent,
  type FlightSetup,
  type FlightState,
  type HudData,
} from '../src/engine/flight';
import { saveLastSetup } from '../src/lib/pro';
import { buildFlightRecord, saveFlightRecord } from '../src/lib/logbook';

const INITIAL_HUD: HudData = {
  airspeedKt: 0,
  altitudeFt: 0,
  headingDeg: 0,
  verticalSpeedFpm: 0,
  groundSpeedKt: 0,
  phase: 'parked',
  stalled: false,
  windKt: 8,
  windFromDeg: 0,
  timeSec: 0,
};

export default function FlightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ aircraft?: string; airport?: string; runway?: string }>();

  const aircraft = getAircraftById(params.aircraft ?? '');
  const airport = getAirportByIcao(params.airport ?? '');
  const runway =
    airport?.runways.find((r) => r.ident === params.runway) ?? airport?.runways[0];

  const setup: FlightSetup | null =
    aircraft && airport && runway ? { aircraft, airport, runway } : null;

  const controlsRef = useRef<Controls>({
    throttle: 0,
    pitch: 0,
    roll: 0,
    flaps: 0,
    gearDown: true,
    brakes: false,
  });
  const [hud, setHud] = useState<HudData>(INITIAL_HUD);
  const [paused, setPaused] = useState(false);
  const [flaps, setFlaps] = useState(0);
  const [gearDown, setGearDown] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [finished, setFinished] = useState<null | {
    outcome: 'landed' | 'crashed';
    message: string;
    timeSec: number;
    maxAltFt: number;
    distanceNmi: number;
  }>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordSaved = useRef(false);
  // Live sim state, owned here and shared with the 3D scene (the scene
  // steps it every frame). Reset whenever the flight setup changes.
  const stateRef = useRef<FlightState | null>(null);
  const setupKey = setup ? `${setup.aircraft.id}-${setup.airport.icao}-${setup.runway.ident}` : '';

  useEffect(() => {
    if (setup) {
      stateRef.current = createFlight(setup);
      setHud(toHud(stateRef.current));
      saveLastSetup({
        aircraftId: setup.aircraft.id,
        airportIcao: setup.airport.icao,
        runwayIdent: setup.runway.ident,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupKey]);

  useEffect(() => {
    return () => {
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, []);

  const showBanner = useCallback((message: string) => {
    setBanner(message);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), 4000);
  }, []);

  const onEvent = useCallback(
    (event: FlightEvent) => {
      showBanner(event.message);
      if ((event.type === 'touchdown' || event.type === 'crash') && setup && !recordSaved.current) {
        recordSaved.current = true;
        setPaused(true);
        const state = stateRef.current;
        if (state) {
          // The engine already counted this landing before emitting the
          // touchdown event, so the record is built straight from state.
          saveFlightRecord(
            buildFlightRecord(setup, state, event.type === 'touchdown' ? 'landed' : 'crashed'),
          );
          setFinished({
            outcome: event.type === 'touchdown' ? 'landed' : 'crashed',
            message: event.message,
            timeSec: state.timeSec,
            maxAltFt: state.maxAltitudeFt,
            distanceNmi: state.distanceNmi,
          });
        }
      }
    },
    [setup, showBanner],
  );

  // Keep the flight state ref fresh for the record: the scene owns the
  // live state, so mirror the HUD-visible phase here instead.
  const onHud = useCallback((h: HudData) => {
    setHud(h);
  }, []);

  if (!setup || !stateRef.current) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Flight not found</Text>
        <Text style={styles.errorText}>
          That aircraft or airport does not exist. Pick another one.
        </Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlightScene
        key={setupKey}
        setup={setup}
        controlsRef={controlsRef}
        paused={paused || finished !== null}
        stateRef={stateRef as MutableRefObject<FlightState>}
        onHud={onHud}
        onEvent={onEvent}
      />
      <Hud hud={hud} throttle={controlsRef.current.throttle} flaps={flaps} gearDown={gearDown} />

      <View style={styles.topBar}>
        <Pressable style={styles.endBtn} onPress={() => router.back()}>
          <Text style={styles.endBtnText}>✕ End flight</Text>
        </Pressable>
        <Text style={styles.routeText}>
          {setup.airport.icao} · RWY {setup.runway.ident} · {setup.aircraft.name}
        </Text>
      </View>

      {banner && !finished ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{banner}</Text>
        </View>
      ) : null}

      {!finished ? (
        <FlightControls
          controlsRef={controlsRef}
          paused={paused}
          flaps={flaps}
          gearDown={gearDown}
          onPause={() => setPaused((p) => !p)}
          onFlaps={() => {
            const next = (flaps + 1) % 4;
            setFlaps(next);
            controlsRef.current.flaps = next;
          }}
          onGear={() => {
            const next = !gearDown;
            setGearDown(next);
            controlsRef.current.gearDown = next;
          }}
          onBrake={(down) => {
            controlsRef.current.brakes = down;
          }}
        />
      ) : null}

      {finished ? (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>
            {finished.outcome === 'landed' ? 'Flight complete' : 'Flight over'}
          </Text>
          <Text style={styles.summaryText}>{finished.message}</Text>
          <Text style={styles.summaryStats}>
            {finished.timeSec >= 60
              ? `${Math.floor(finished.timeSec / 60)} min ${Math.round(finished.timeSec % 60)} sec`
              : `${Math.round(finished.timeSec)} sec`}{' '}
            in the air · max {Math.round(finished.maxAltFt).toLocaleString()} ft ·{' '}
            {finished.distanceNmi.toFixed(1)} nmi · saved to your flight log
          </Text>
          <Pressable
            style={styles.summaryBtn}
            onPress={() => {
              recordSaved.current = false;
              setFinished(null);
              setPaused(false);
              router.back();
            }}
          >
            <Text style={styles.summaryBtnText}>Done</Text>
          </Pressable>
        </View>
      ) : null}

      {paused && !finished ? (
        <View style={styles.pausedOverlay}>
          <Text style={styles.pausedText}>PAUSED</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#050914', flex: 1 },
  center: {
    alignItems: 'center',
    backgroundColor: '#050914',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '800' },
  errorText: { color: '#94A3B8', fontSize: 15, marginTop: 8, textAlign: 'center' },
  backBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: 12,
    paddingTop: 92,
    position: 'absolute',
    right: 0,
  },
  endBtn: {
    backgroundColor: 'rgba(5, 9, 20, 0.7)',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  endBtnText: { color: '#F8FAFC', fontSize: 12, fontWeight: '700' },
  routeText: {
    backgroundColor: 'rgba(5, 9, 20, 0.7)',
    borderRadius: 8,
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  banner: {
    alignSelf: 'center',
    backgroundColor: 'rgba(5, 9, 20, 0.85)',
    borderColor: '#38BDF8',
    borderRadius: 10,
    borderWidth: 1,
    bottom: 210,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: 'absolute',
  },
  bannerText: { color: '#F8FAFC', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  summary: {
    backgroundColor: '#0C1626',
    borderColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    bottom: 40,
    left: 20,
    padding: 20,
    position: 'absolute',
    right: 20,
  },
  summaryTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '800' },
  summaryText: { color: '#E2E8F0', fontSize: 15, lineHeight: 21, marginTop: 6 },
  summaryStats: { color: '#94A3B8', fontSize: 13, marginTop: 10 },
  summaryBtn: {
    alignItems: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 12,
  },
  summaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pausedOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(5, 9, 20, 0.6)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pausedText: { color: '#F8FAFC', fontSize: 28, fontWeight: '800', letterSpacing: 4 },
});
