import { useRef, useState, type MutableRefObject } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlightControls } from '../src/engine/flight';

/**
 * Touch flight controls: a virtual joystick (pitch + roll), a vertical
 * throttle strip, and FLAPS / GEAR / BRAKE buttons.
 *
 * The joystick and throttle write straight into a shared mutable ref —
 * the 3D scene reads that ref every frame, so the controls never
 * re-render the scene. Local state only moves the on-screen knobs.
 */
export function FlightControls({
  controlsRef,
  paused,
  flaps,
  gearDown,
  onPause,
  onFlaps,
  onGear,
  onBrake,
}: {
  controlsRef: MutableRefObject<FlightControls>;
  paused: boolean;
  /** Display state (kept in the parent, since the ref alone never re-renders). */
  flaps: number;
  gearDown: boolean;
  onPause: () => void;
  onFlaps: () => void;
  onGear: () => void;
  onBrake: (down: boolean) => void;
}) {
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [throttle, setThrottle] = useState(0);
  const padRef = useRef<View>(null);
  const stripRef = useRef<View>(null);
  const padLayout = useRef({ x: 0, y: 0 });
  const stripLayout = useRef({ x: 0, y: 0 });

  const PAD_RADIUS = 62;
  const STRIP_HEIGHT = 150;

  const stickResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      padRef.current?.measureInWindow((x, y) => {
        padLayout.current = { x, y };
        updateStick(e.nativeEvent.pageX, e.nativeEvent.pageY);
      });
    },
    onPanResponderMove: (e) => {
      updateStick(e.nativeEvent.pageX, e.nativeEvent.pageY);
    },
    onPanResponderRelease: () => {
      controlsRef.current.pitch = 0;
      controlsRef.current.roll = 0;
      setStick({ x: 0, y: 0 });
    },
    onPanResponderTerminate: () => {
      controlsRef.current.pitch = 0;
      controlsRef.current.roll = 0;
      setStick({ x: 0, y: 0 });
    },
  });

  function updateStick(pageX: number, pageY: number) {
    const { x, y } = padLayout.current;
    const cx = x + PAD_RADIUS;
    const cy = y + PAD_RADIUS;
    let dx = (pageX - cx) / PAD_RADIUS;
    let dy = (pageY - cy) / PAD_RADIUS;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    controlsRef.current.roll = dx;
    controlsRef.current.pitch = -dy;
    setStick({ x: dx, y: dy });
  }

  const throttleResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      stripRef.current?.measureInWindow((x, y) => {
        stripLayout.current = { x, y };
        updateThrottle(e.nativeEvent.pageY);
      });
    },
    onPanResponderMove: (e) => {
      updateThrottle(e.nativeEvent.pageY);
    },
  });

  function updateThrottle(pageY: number) {
    const { y } = stripLayout.current;
    const t = Math.min(1, Math.max(0, 1 - (pageY - y) / STRIP_HEIGHT));
    controlsRef.current.throttle = t;
    setThrottle(t);
  }

  const c = controlsRef.current;
  void c; // controls are mutated via the ref; display state comes from props.

  return (
    <View style={styles.deck} pointerEvents="box-none">
      {/* Throttle strip (left) */}
      <View style={styles.throttleCol}>
        <Text style={styles.deckLabel}>THR {Math.round(throttle * 100)}%</Text>
        <View
          ref={stripRef}
          style={[styles.strip, { height: STRIP_HEIGHT }]}
          {...throttleResponder.panHandlers}
        >
          <View style={[styles.stripFill, { height: `${throttle * 100}%` }]} />
          <View style={[styles.stripKnob, { bottom: throttle * (STRIP_HEIGHT - 20) }]} />
        </View>
      </View>

      {/* Buttons (middle) */}
      <View style={styles.buttonsCol}>
        <Pressable style={styles.btn} onPress={onFlaps}>
          <Text style={styles.btnText}>FLAPS {flaps}</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, gearDown ? styles.btnOn : null]}
          onPress={onGear}
        >
          <Text style={styles.btnText}>GEAR {gearDown ? 'DOWN' : 'UP'}</Text>
        </Pressable>
        <Pressable
          style={styles.btn}
          onPressIn={() => onBrake(true)}
          onPressOut={() => onBrake(false)}
        >
          <Text style={styles.btnText}>BRAKE</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={onPause}>
          <Text style={styles.btnText}>{paused ? 'RESUME' : 'PAUSE'}</Text>
        </Pressable>
      </View>

      {/* Joystick (right) */}
      <View style={styles.stickCol}>
        <Text style={styles.deckLabel}>YOKE</Text>
        <View
          ref={padRef}
          style={[styles.pad, { width: PAD_RADIUS * 2, height: PAD_RADIUS * 2 }]}
          {...stickResponder.panHandlers}
        >
          <View
            style={[
              styles.knob,
              {
                transform: [
                  { translateX: stick.x * (PAD_RADIUS - 22) },
                  { translateY: stick.y * (PAD_RADIUS - 22) },
                ],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  deck: {
    alignItems: 'flex-end',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingBottom: 24,
    paddingHorizontal: 16,
    position: 'absolute',
    right: 0,
  },
  deckLabel: { color: '#7DD3FC', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  throttleCol: { alignItems: 'center', gap: 6 },
  strip: {
    backgroundColor: 'rgba(12, 22, 38, 0.8)',
    borderColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    width: 44,
  },
  stripFill: {
    backgroundColor: '#0284C7',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  stripKnob: {
    backgroundColor: '#F8FAFC',
    borderRadius: 3,
    height: 20,
    left: 4,
    position: 'absolute',
    right: 4,
  },
  buttonsCol: { gap: 8 },
  btn: {
    alignItems: 'center',
    backgroundColor: 'rgba(12, 22, 38, 0.85)',
    borderColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnOn: { backgroundColor: '#14532D', borderColor: '#22C55E' },
  btnText: { color: '#F8FAFC', fontSize: 12, fontWeight: '800' },
  stickCol: { alignItems: 'center', gap: 6 },
  pad: {
    alignItems: 'center',
    backgroundColor: 'rgba(12, 22, 38, 0.8)',
    borderColor: '#1E293B',
    borderRadius: 62,
    borderWidth: 1,
    justifyContent: 'center',
  },
  knob: {
    backgroundColor: '#38BDF8',
    borderRadius: 22,
    height: 44,
    width: 44,
  },
});
