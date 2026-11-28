import { useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import type { FlightSetup } from '../src/engine/flight';
import {
  stepFlight,
  toHud,
  type FlightControls,
  type FlightEvent,
  type FlightState,
  type HudData,
} from '../src/engine/flight';

/**
 * 3D flight scene (react-three-fiber + three.js).
 *
 * Scale: 1 unit = 100 ft. The scene is procedural — sky, sun, clouds,
 * terrain, runway, and a low-poly aircraft built from primitives and
 * painted in the selected aircraft's livery color. No downloaded models,
 * no network, so it runs the same on iOS, Android, and web.
 *
 * The sim loop lives inside the Canvas (useFrame): it steps the flight
 * engine, moves the aircraft + chase camera, and pushes HUD data out to
 * the parent at ~7 Hz. Controls arrive through a shared mutable ref.
 */

// --- Seeded random so clouds never jump between renders. ---
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CloudDef {
  x: number;
  y: number;
  z: number;
  scale: number;
}

function useClouds(): CloudDef[] {
  return useMemo(() => {
    const rand = mulberry32(20261115);
    const clouds: CloudDef[] = [];
    for (let i = 0; i < 26; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 250 + rand() * 1300;
      clouds.push({
        x: Math.cos(angle) * radius,
        y: 28 + rand() * 60,
        z: Math.sin(angle) * radius,
        scale: 6 + rand() * 14,
      });
    }
    return clouds;
  }, []);
}

function Clouds({ defs }: { defs: CloudDef[] }) {
  return (
    <group>
      {defs.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={[c.scale, c.scale * 0.32, c.scale * 0.6]}>
          <mesh>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
          <mesh position={[1.1, 0.25, 0.3]}>
            <sphereGeometry args={[0.7, 12, 10]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
          <mesh position={[-1.1, 0.2, -0.2]}>
            <sphereGeometry args={[0.75, 12, 10]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Runway({ setup }: { setup: FlightSetup }) {
  const runway = setup.runway;
  const lengthUnits = runway.lengthFt / 100;
  const headingRad = (runway.headingDeg * Math.PI) / 180;
  const dashes = Math.floor(lengthUnits / 4);
  return (
    <group rotation={[0, -headingRad, 0]}>
      {/* Pavement */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[1.6, lengthUnits]} />
        <meshStandardMaterial color="#1F2937" />
      </mesh>
      {/* Centerline dashes */}
      {Array.from({ length: dashes }, (_, i) => {
        const z = -lengthUnits / 2 + 2 + i * 4;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, z]}>
            <planeGeometry args={[0.08, 1.6]} />
            <meshStandardMaterial color="#F8FAFC" />
          </mesh>
        );
      })}
      {/* Threshold bars, both ends */}
      {[-1, 1].map((end) => (
        <mesh
          key={end}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.04, (end * lengthUnits) / 2 - end * 1.2]}
        >
          <planeGeometry args={[1.3, 0.5]} />
          <meshStandardMaterial color="#F8FAFC" />
        </mesh>
      ))}
    </group>
  );
}

/** Low-poly aircraft from primitives, painted in the livery color. */
function AircraftModel({
  setup,
  stateRef,
}: {
  setup: FlightSetup;
  stateRef: MutableRefObject<FlightState>;
}) {
  const group = useRef<THREE.Group>(null);
  const scale =
    setup.aircraft.category === 'ga'
      ? 0.55
      : setup.aircraft.category === 'regional'
        ? 0.9
        : setup.aircraft.category === 'narrowbody'
          ? 1.25
          : setup.aircraft.category === 'widebody'
            ? 1.8
            : 1.5;
  const color = setup.aircraft.liveryColor;

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const s = stateRef.current;
    g.position.set(s.xFt / 100, s.altitudeFt / 100 + 0.55, -s.yFt / 100);
    g.rotation.order = 'YXZ';
    g.rotation.y = (-s.headingDeg * Math.PI) / 180;
    g.rotation.x = (s.pitchDeg * Math.PI) / 180;
    g.rotation.z = (-s.rollDeg * Math.PI) / 180;
  });

  return (
    <group ref={group} scale={scale}>
      {/* Fuselage */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.22, 3.4, 12]} />
        <meshStandardMaterial color="#F1F5F9" />
      </mesh>
      {/* Nose */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1.95]}>
        <coneGeometry args={[0.28, 0.7, 12]} />
        <meshStandardMaterial color="#F1F5F9" />
      </mesh>
      {/* Livery stripe */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.29, 0.29, 2.2, 12, 1, true]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Main wings */}
      <mesh position={[0, -0.08, 0.1]}>
        <boxGeometry args={[7.2, 0.08, 0.9]} />
        <meshStandardMaterial color="#E2E8F0" />
      </mesh>
      {/* Tail fin */}
      <mesh position={[0, 0.55, 1.55]}>
        <boxGeometry args={[0.08, 1.1, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Horizontal stabilizers */}
      <mesh position={[0, 0.12, 1.6]}>
        <boxGeometry args={[2.4, 0.07, 0.6]} />
        <meshStandardMaterial color="#E2E8F0" />
      </mesh>
      {/* Engines */}
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} rotation={[Math.PI / 2, 0, 0]} position={[x, -0.28, 0.1]}>
          <cylinderGeometry args={[0.16, 0.16, 0.9, 10]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}
    </group>
  );
}

function SimLoop({
  setup,
  controlsRef,
  paused,
  stateRef,
  onHud,
  onEvent,
}: {
  setup: FlightSetup;
  controlsRef: MutableRefObject<FlightControls>;
  paused: boolean;
  stateRef: MutableRefObject<FlightState>;
  onHud: (hud: HudData) => void;
  onEvent: (event: FlightEvent) => void;
}) {
  const camera = useRef<THREE.Camera | null>(null);
  const hudTimer = useRef(0);
  const camPos = useRef(new THREE.Vector3(0, 3, 8));
  const camLook = useRef(new THREE.Vector3(0, 0.5, 0));

  useFrame((frame, delta) => {
    if (!paused) {
      const { state, events } = stepFlight(
        stateRef.current,
        setup.aircraft,
        controlsRef.current,
        delta,
      );
      stateRef.current = state;
      for (const e of events) onEvent(e);
      hudTimer.current += delta;
      if (hudTimer.current >= 0.15) {
        hudTimer.current = 0;
        onHud(toHud(state));
      }
    }
    // Chase camera: behind + above the aircraft, looking ahead.
    const cam = camera.current ?? frame.camera;
    camera.current = cam;
    const s = stateRef.current;
    const hRad = (s.headingDeg * Math.PI) / 180;
    const px = s.xFt / 100;
    const py = s.altitudeFt / 100 + 0.55;
    const pz = -s.yFt / 100;
    const fx = Math.sin(hRad);
    const fz = -Math.cos(hRad);
    const targetPos = new THREE.Vector3(px - fx * 7.5, py + 2.6, pz - fz * 7.5);
    const targetLook = new THREE.Vector3(px + fx * 8, py + 0.4, pz + fz * 8);
    const k = 1 - Math.exp(-3.5 * Math.min(delta, 0.05));
    camPos.current.lerp(targetPos, k);
    camLook.current.lerp(targetLook, k);
    cam.position.copy(camPos.current);
    cam.lookAt(camLook.current);
  });

  return null;
}

export function FlightScene({
  setup,
  controlsRef,
  paused,
  stateRef,
  onHud,
  onEvent,
}: {
  setup: FlightSetup;
  controlsRef: MutableRefObject<FlightControls>;
  paused: boolean;
  /** Live sim state, owned by the parent (it builds the flight record). */
  stateRef: MutableRefObject<FlightState>;
  onHud: (hud: HudData) => void;
  onEvent: (event: FlightEvent) => void;
}) {
  const clouds = useClouds();

  // tvOS (Nov 27, 2026): expo-gl has no tvOS support, and the tvOS JS
  // bundle uses the fork's ios platform resolution, so
  // FlightScene.macos.tsx does NOT apply here. Render the same honest
  // placeholder the macOS variant shows (mirroring its copy and style):
  // the rest of the app is fully present on TV, but the 3D view itself
  // does not render on Apple TV. Platform.isTV is false on every other
  // platform, so iOS/Android/web/macOS are unchanged.
  if ((Platform as unknown as { isTV?: boolean }).isTV) {
    return (
      <View style={tvStyles.root}>
        <Text style={tvStyles.title}>3D flight view isn't available on TV yet</Text>
        <Text style={tvStyles.body}>
          {setup.aircraft.name} · {setup.airport.icao} · Runway {setup.runway.ident}
        </Text>
        <Text style={tvStyles.body}>
          The 3D view runs on iPhone, iPad and Android. On Apple TV you can still
          browse the full fleet and airport catalog and review your flight log.
        </Text>
      </View>
    );
  }

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 60, near: 0.1, far: 6000, position: [0, 3, 8] }}
      style={{ flex: 1 }}
    >
      <color attach="background" args={['#8EC3E8']} />
      <fog attach="fog" args={['#8EC3E8', 300, 2200]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[120, 220, 60]} intensity={1.5} />
      {/* Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[6000, 6000]} />
        <meshStandardMaterial color="#2D5A27" />
      </mesh>
      {/* A few darker fields for texture */}
      {[
        [-180, -140, 260, 180],
        [220, 90, 320, 200],
        [-60, 260, 200, 260],
        [300, -220, 240, 160],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, z]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#24491F" />
        </mesh>
      ))}
      <Runway setup={setup} />
      <Clouds defs={clouds} />
      <AircraftModel setup={setup} stateRef={stateRef} />
      <SimLoop
        setup={setup}
        controlsRef={controlsRef}
        paused={paused}
        stateRef={stateRef}
        onHud={onHud}
        onEvent={onEvent}
      />
    </Canvas>
  );
}

const tvStyles = StyleSheet.create({
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
