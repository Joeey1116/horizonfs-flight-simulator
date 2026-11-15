/**
 * Catalog accessors — the single place screens read aircraft + airports.
 *
 * Data lives in aircraft.json (27 aircraft, real specs) and airports.json
 * (140 airports, real ICAO data from OurAirports, CC0 — see
 * /tmp/build_airports.py for the regeneration script).
 */
import aircraftData from './aircraft.json';
import airportData from './airports.json';
import type { Aircraft, Airport } from './types';

export const AIRCRAFT: Aircraft[] = aircraftData as Aircraft[];
export const AIRPORTS: Airport[] = airportData as Airport[];

export function getAircraftById(id: string): Aircraft | undefined {
  return AIRCRAFT.find((a) => a.id === id);
}

export function getAirportByIcao(icao: string): Airport | undefined {
  return AIRPORTS.find((a) => a.icao.toUpperCase() === icao.toUpperCase());
}

/** Free aircraft (8) — the ones anyone can fly without Pro. */
export function freeAircraft(): Aircraft[] {
  return AIRCRAFT.filter((a) => !a.pro);
}

/** Pro aircraft — locked behind the Pro upgrade. */
export function proAircraft(): Aircraft[] {
  return AIRCRAFT.filter((a) => a.pro);
}

export function aircraftByCategory(): Record<string, Aircraft[]> {
  const out: Record<string, Aircraft[]> = {};
  for (const a of AIRCRAFT) {
    (out[a.category] ??= []).push(a);
  }
  return out;
}

/** Major hubs first, then the rest alphabetically by city. */
export function featuredAirports(): Airport[] {
  return AIRPORTS.filter((a) => a.featured).sort((a, b) =>
    a.city.localeCompare(b.city),
  );
}

export function searchAirports(query: string): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return AIRPORTS;
  return AIRPORTS.filter(
    (a) =>
      a.icao.toLowerCase().includes(q) ||
      a.iata.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q),
  );
}

export function searchAircraft(query: string): Aircraft[] {
  const q = query.trim().toLowerCase();
  if (!q) return AIRCRAFT;
  return AIRCRAFT.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.manufacturer.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q),
  );
}

/** The default first flight: Cessna 172 out of JFK runway 13R. */
export const DEFAULT_AIRCRAFT_ID = 'c172';
export const DEFAULT_AIRPORT_ICAO = 'KJFK';
