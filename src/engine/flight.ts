/**
 * Flight engine — a small, honest flight model.
 *
 * Units throughout: knots for speed, feet for distance/altitude, degrees
 * for angles, feet-per-minute for vertical speed. The model is arcade
 * simple but physically shaped: thrust vs drag sets top speed, lift
 * grows with speed squared, stalls are real, and landings are judged on
 * gear + sink rate. No dependencies, no React — pure functions, so it is
 * testable and reusable (the 3D scene calls step() every frame).
 *
 * This is v1: flat-earth local coordinates (origin = departure runway
 * threshold), one wind vector per flight, no weather, no navigation.
 */
import type { Aircraft, Airport, Runway } from '../data/types';

export type FlightPhase = 'parked' | 'rolling' | 'airborne' | 'landed' | 'crashed';

export interface FlightControls {
  /** 0..1 */
  throttle: number;
  /** -1 (nose down) .. 1 (nose up) */
  pitch: number;
  /** -1 (left) .. 1 (right) */
  roll: number;
  /** 0..3 — flap notches; each notch lowers stall speed ~8%. */
  flaps: number;
  gearDown: boolean;
  brakes: boolean;
}

export type FlightEventType =
  | 'takeoff'
  | 'touchdown'
  | 'stall'
  | 'stall-recovered'
  | 'crash'
  | 'gear-warning'
  | 'overspeed';

export interface FlightEvent {
  type: FlightEventType;
  message: string;
}

export interface FlightState {
  phase: FlightPhase;
  /** Local flat-earth position, feet east/north of the runway threshold. */
  xFt: number;
  yFt: number;
  /** Height above the runway, feet. */
  altitudeFt: number;
  airspeedKt: number;
  groundSpeedKt: number;
  headingDeg: number;
  pitchDeg: number;
  rollDeg: number;
  verticalSpeedFpm: number;
  windKt: number;
  windFromDeg: number;
  stalled: boolean;
  timeSec: number;
  maxAltitudeFt: number;
  distanceNmi: number;
  landings: number;
  /** True once the gear warning has fired this flight. */
  gearWarned: boolean;
  /** True once the overspeed warning has fired (resets when back under). */
  overspeedWarned: boolean;
}

export interface FlightSetup {
  aircraft: Aircraft;
  airport: Airport;
  runway: Runway;
}

const KT_TO_FPS = 1.68781;
const G_FPS2 = 32.174;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Thrust acceleration at full throttle, ft/s^2 — jets push harder. */
function maxThrustAccel(aircraft: Aircraft): number {
  switch (aircraft.category) {
    case 'ga':
      return aircraft.maxSpeedKt > 300 ? 11 : 8;
    case 'regional':
      return 11;
    case 'narrowbody':
      return 13;
    case 'widebody':
      return 12;
    case 'legend':
      return 18;
  }
}

/** Stall speed with the current flap setting. */
export function stallSpeedKt(aircraft: Aircraft, flaps: number): number {
  return aircraft.stallKt * (1 - 0.08 * flaps);
}

export function createFlight(setup: FlightSetup): FlightState {
  const { runway } = setup;
  // A steady crosswind so landings take a little skill: 8 kt, 40° off the
  // runway heading. Deterministic per runway (same flight, same wind).
  const windFromDeg = (runway.headingDeg + 40) % 360;
  return {
    phase: 'parked',
    xFt: 0,
    yFt: 0,
    altitudeFt: 0,
    airspeedKt: 0,
    groundSpeedKt: 0,
    headingDeg: runway.headingDeg,
    pitchDeg: 0,
    rollDeg: 0,
    verticalSpeedFpm: 0,
    windKt: 8,
    windFromDeg,
    stalled: false,
    timeSec: 0,
    maxAltitudeFt: 0,
    distanceNmi: 0,
    landings: 0,
    gearWarned: false,
    overspeedWarned: false,
  };
}

export interface StepResult {
  state: FlightState;
  events: FlightEvent[];
}

/**
 * Advance the simulation by dt seconds. Returns a NEW state object (the
 * input is never mutated) plus any events that fired this step.
 */
export function stepFlight(
  prev: FlightState,
  aircraft: Aircraft,
  controls: FlightControls,
  dt: number,
): StepResult {
  const events: FlightEvent[] = [];
  const s: FlightState = { ...prev };
  const step = Math.min(dt, 0.05); // clamp huge frames (tab switches)
  s.timeSec += step;

  const stallKt = stallSpeedKt(aircraft, controls.flaps);
  const vFps = s.airspeedKt * KT_TO_FPS;

  // --- Thrust vs drag: top speed at full throttle ~= maxSpeedKt. ---
  const thrustAccel = maxThrustAccel(aircraft) * controls.throttle;
  const vMaxFps = aircraft.maxSpeedKt * KT_TO_FPS;
  const dragAccel = (maxThrustAccel(aircraft) * (vFps * vFps)) / (vMaxFps * vMaxFps);
  let accel = thrustAccel - dragAccel;
  // Climbing costs energy; descending gives some back.
  accel -= (s.verticalSpeedFpm / 60) * 0.012;
  // Brakes only bite on the ground.
  if (controls.brakes && s.phase !== 'airborne') accel -= 14;
  // Rolling resistance on the ground.
  if (s.phase !== 'airborne') accel -= 0.6;

  let airspeedKt = Math.max(0, s.airspeedKt + (accel / KT_TO_FPS) * step);

  // --- Stall ---
  // Hysteresis: enter the stall below stall speed, leave it only once the
  // airplane is genuinely flying again (stall speed + 10%). Without this
  // the flag flickers every frame while the speed sits on the boundary,
  // and the UI spams stall/recovered banners (caught in the engine smoke
  // test, Nov 15 2026).
  const recoverKt = stallKt * 1.1;
  const stalled =
    s.phase === 'airborne' &&
    (s.stalled ? airspeedKt < recoverKt : airspeedKt < stallKt);
  if (stalled && !s.stalled) {
    events.push({
      type: 'stall',
      message: 'Stall! Lower the nose and add power.',
    });
  }
  if (!stalled && s.stalled) {
    events.push({ type: 'stall-recovered', message: 'Stall recovered.' });
  }
  s.stalled = stalled;

  // --- Pitch / roll targets from the stick ---
  const targetPitch = stalled ? -8 : controls.pitch * 14;
  const targetRoll = stalled ? 0 : controls.roll * 30;
  const pitchRate = 28; // deg/sec toward target
  const rollRate = 55;
  const pitchDeg = s.pitchDeg + clamp(targetPitch - s.pitchDeg, -pitchRate * step, pitchRate * step);
  const rollDeg = s.rollDeg + clamp(targetRoll - s.rollDeg, -rollRate * step, rollRate * step);

  // --- Turn: bank angle turns the heading (standard rate-turn shape). ---
  let headingDeg = s.headingDeg;
  if (s.phase === 'airborne' && airspeedKt > stallKt) {
    const turnRateDps = (1091 * Math.tan((rollDeg * Math.PI) / 180)) / Math.max(airspeedKt, 40);
    headingDeg = (headingDeg + turnRateDps * step + 360) % 360;
  }

  // --- Vertical speed: pitch sets the target climb/descent. ---
  let verticalSpeedFpm: number;
  if (s.phase === 'airborne') {
    const targetVs = stalled ? -1800 : pitchDeg * 260;
    verticalSpeedFpm = s.verticalSpeedFpm + clamp(targetVs - s.verticalSpeedFpm, -900 * step, 900 * step);
    // Not enough speed to hold the climb: sink instead.
    if (airspeedKt < stallKt * 1.05 && verticalSpeedFpm > -400) {
      verticalSpeedFpm = -400;
    }
  } else {
    verticalSpeedFpm = 0;
  }

  // --- Altitude + position ---
  let altitudeFt = s.altitudeFt + (verticalSpeedFpm / 60) * step;
  const groundSpeedKt = Math.max(0, airspeedKt + windAlongTrack(s, controls));
  const headingRad = (headingDeg * Math.PI) / 180;
  const gsFps = groundSpeedKt * KT_TO_FPS;
  let xFt = s.xFt + Math.sin(headingRad) * gsFps * step;
  let yFt = s.yFt + Math.cos(headingRad) * gsFps * step;
  // Crosswind drift.
  const windRad = ((s.windFromDeg + 180) * Math.PI) / 180; // wind blows TOWARD this
  xFt += Math.sin(windRad) * s.windKt * KT_TO_FPS * step * 0.35;
  yFt += Math.cos(windRad) * s.windKt * KT_TO_FPS * step * 0.35;

  // --- Phase transitions ---
  let phase = s.phase;
  let landings = s.landings;
  let gearWarned = s.gearWarned;

  if (phase === 'parked' && controls.throttle > 0.05 && airspeedKt > 2) {
    phase = 'rolling';
  }
  if ((phase === 'rolling' || phase === 'parked') && airspeedKt >= aircraft.rotationKt && pitchDeg > 2) {
    phase = 'airborne';
    altitudeFt = Math.max(altitudeFt, 2);
    events.push({ type: 'takeoff', message: `Airborne — gear up, flaps up when ready.` });
  }
  if (phase === 'airborne' && altitudeFt <= 0) {
    altitudeFt = 0;
    const sink = Math.abs(verticalSpeedFpm);
    if (!controls.gearDown) {
      phase = 'crashed';
      events.push({
        type: 'crash',
        message: 'Gear-up landing. The airplane is a write-off.',
      });
    } else if (sink > 800) {
      phase = 'crashed';
      events.push({
        type: 'crash',
        message: `Hard landing — ${Math.round(sink)} fpm down. The gear gave way.`,
      });
    } else {
      phase = 'landed';
      landings += 1;
      verticalSpeedFpm = 0;
      events.push({
        type: 'touchdown',
        message:
          sink < 250
            ? 'Butter. That was a beautiful landing.'
            : 'Touchdown. A little firm, but you are down safe.',
      });
    }
  }
  if (phase === 'landed') {
    // Rollout: keep decelerating; a full stop ends the flight.
    airspeedKt = Math.max(0, airspeedKt - (controls.brakes ? 22 : 6) * step);
    if (airspeedKt < 3) phase = 'parked';
  }
  // Gear warning on final: low, slow, gear up.
  if (
    phase === 'airborne' &&
    altitudeFt < 800 &&
    altitudeFt > 0 &&
    !controls.gearDown &&
    !gearWarned
  ) {
    gearWarned = true;
    events.push({ type: 'gear-warning', message: 'Gear up on final — lower the gear!' });
  }
  // Overspeed.
  if (airspeedKt > aircraft.maxSpeedKt && !s.overspeedWarned) {
    s.overspeedWarned = true;
    events.push({ type: 'overspeed', message: 'Overspeed! Throttle back.' });
  } else if (airspeedKt < aircraft.maxSpeedKt * 0.95) {
    s.overspeedWarned = false;
  }

  const maxAltitudeFt = Math.max(s.maxAltitudeFt, altitudeFt);
  const distanceNmi = s.distanceNmi + (gsFps * step) / 6076;

  return {
    state: {
      ...s,
      phase,
      xFt,
      yFt,
      altitudeFt,
      airspeedKt,
      groundSpeedKt,
      headingDeg,
      pitchDeg,
      rollDeg,
      verticalSpeedFpm,
      landings,
      gearWarned,
      maxAltitudeFt,
      distanceNmi,
    },
    events,
  };
}

/** Headwind/tailwind component along the current heading, knots. */
function windAlongTrack(state: FlightState, _controls: FlightControls): number {
  const rel = ((state.windFromDeg - state.headingDeg) * Math.PI) / 180;
  // Headwind (wind from ahead) slows ground speed; tailwind speeds it up.
  return -Math.cos(rel) * state.windKt * 0.7;
}

/** HUD snapshot — what the flight screen shows, ~5x per second. */
export interface HudData {
  airspeedKt: number;
  altitudeFt: number;
  headingDeg: number;
  verticalSpeedFpm: number;
  groundSpeedKt: number;
  phase: FlightPhase;
  stalled: boolean;
  windKt: number;
  windFromDeg: number;
  timeSec: number;
}

export function toHud(state: FlightState): HudData {
  return {
    airspeedKt: Math.round(state.airspeedKt),
    altitudeFt: Math.round(state.altitudeFt),
    headingDeg: Math.round(state.headingDeg),
    verticalSpeedFpm: Math.round(state.verticalSpeedFpm / 10) * 10,
    groundSpeedKt: Math.round(state.groundSpeedKt),
    phase: state.phase,
    stalled: state.stalled,
    windKt: state.windKt,
    windFromDeg: state.windFromDeg,
    timeSec: state.timeSec,
  };
}
