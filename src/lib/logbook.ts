/**
 * Flight log — every completed flight becomes a record the companion
 * Flight Journal pilot-logbook app can import.
 *
 * A record is plain JSON (no accounts, no network): aircraft, departure,
 * times, landings, max altitude, distance. Flight Journal reads the
 * same shape on import. Records are stored on-device (AsyncStorage) and
 * can be exported as a JSON file for the logbook.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FlightState } from '../engine/flight';
import type { FlightSetup } from '../engine/flight';

export interface FlightRecord {
  /** ISO date of the flight, e.g. "2026-11-15". */
  date: string;
  aircraftId: string;
  aircraftName: string;
  departureIcao: string;
  departureName: string;
  runwayIdent: string;
  /** Flight time, minutes (wheels-up to touchdown). */
  flightMinutes: number;
  landings: number;
  maxAltitudeFt: number;
  distanceNmi: number;
  outcome: 'landed' | 'crashed' | 'ended-early';
}

const RECORDS_KEY = '@horizonfs/flight-log-v1';

export function buildFlightRecord(
  setup: FlightSetup,
  state: FlightState,
  outcome: FlightRecord['outcome'],
): FlightRecord {
  return {
    date: new Date().toISOString().slice(0, 10),
    aircraftId: setup.aircraft.id,
    aircraftName: setup.aircraft.name,
    departureIcao: setup.airport.icao,
    departureName: setup.airport.name,
    runwayIdent: setup.runway.ident,
    flightMinutes: Math.max(0, Math.round(state.timeSec / 60)),
    landings: state.landings,
    maxAltitudeFt: Math.round(state.maxAltitudeFt),
    distanceNmi: Math.round(state.distanceNmi * 10) / 10,
    outcome,
  };
}

export async function saveFlightRecord(record: FlightRecord): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(RECORDS_KEY);
    const list: FlightRecord[] = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    // Non-fatal: the flight still happened, it just was not logged.
  }
}

export async function getFlightRecords(): Promise<FlightRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(RECORDS_KEY);
    return raw ? (JSON.parse(raw) as FlightRecord[]) : [];
  } catch {
    return [];
  }
}

/** JSON text for export — paste into Flight Journal's import. */
export async function exportFlightLogJson(): Promise<string> {
  const records = await getFlightRecords();
  return JSON.stringify({ app: 'flight-simulator', version: 1, records }, null, 2);
}
