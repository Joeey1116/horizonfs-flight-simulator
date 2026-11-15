import { StyleSheet, Text, View } from 'react-native';
import type { HudData } from '../src/engine/flight';

const PHASE_LABELS: Record<HudData['phase'], string> = {
  parked: 'PARKED',
  rolling: 'TAKEOFF ROLL',
  airborne: 'AIRBORNE',
  landed: 'LANDED',
  crashed: 'CRASHED',
};

export function Hud({
  hud,
  throttle,
  flaps,
  gearDown,
}: {
  hud: HudData;
  throttle: number;
  flaps: number;
  gearDown: boolean;
}) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      {hud.stalled ? (
        <View style={styles.stallBanner}>
          <Text style={styles.stallText}>⚠ STALL — LOWER NOSE, ADD POWER</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <HudCell label="AIRSPEED" value={`${hud.airspeedKt}`} unit="kt" />
        <HudCell label="ALTITUDE" value={`${hud.altitudeFt.toLocaleString()}`} unit="ft" />
        <HudCell label="HEADING" value={`${hud.headingDeg}°`} unit="" />
        <HudCell label="VERT SPEED" value={`${hud.verticalSpeedFpm > 0 ? '+' : ''}${hud.verticalSpeedFpm}`} unit="fpm" />
      </View>
      <View style={styles.row}>
        <HudCell label="GROUND SPD" value={`${hud.groundSpeedKt}`} unit="kt" />
        <HudCell
          label="WIND"
          value={`${hud.windFromDeg}°/${hud.windKt}`}
          unit="kt"
        />
        <HudCell label="THR" value={`${Math.round(throttle * 100)}`} unit="%" />
        <HudCell label="FLAPS" value={`${flaps}`} unit="" />
        <HudCell label="GEAR" value={gearDown ? 'DOWN' : 'UP'} unit="" />
        <HudCell label="PHASE" value={PHASE_LABELS[hud.phase]} unit="" />
      </View>
    </View>
  );
}

function HudCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>
        {value}
        {unit ? <Text style={styles.cellUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { left: 0, position: 'absolute', right: 0, top: 0 },
  stallBanner: {
    alignItems: 'center',
    backgroundColor: '#7F1D1D',
    paddingVertical: 6,
  },
  stallText: { color: '#FECACA', fontSize: 13, fontWeight: '800' },
  row: {
    backgroundColor: 'rgba(5, 9, 20, 0.55)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  cell: { alignItems: 'center', minWidth: 52 },
  cellLabel: { color: '#7DD3FC', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  cellValue: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  cellUnit: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
});
