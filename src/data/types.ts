/**
 * Shared data types for the flight simulator catalog.
 *
 * The catalog is data-driven (like Infinite Flight): the flight engine,
 * the 3D scene, and every screen read from these types. Adding an
 * aircraft or an airport is a data edit, never a code change.
 */

export type AircraftCategory = 'ga' | 'regional' | 'narrowbody' | 'widebody' | 'legend';

export interface Aircraft {
  /** Stable slug, used in routes and save data (e.g. "b737-800"). */
  id: string;
  name: string;
  manufacturer: string;
  category: AircraftCategory;
  /** First flight year. */
  firstFlight: number;
  engines: string;
  /** Typical passenger seats. */
  seats: number;
  /** Never-exceed speed, knots. */
  maxSpeedKt: number;
  /** Typical cruise speed, knots. */
  cruiseSpeedKt: number;
  /** Still-air range, nautical miles. */
  rangeNmi: number;
  /** Maximum takeoff weight, pounds. */
  mtowLb: number;
  /** Rotation speed (Vr), knots — the speed to pull back on takeoff. */
  rotationKt: number;
  /** Stall speed in landing configuration (Vs0), knots. */
  stallKt: number;
  /** Service ceiling, feet. */
  serviceCeilingFt: number;
  /** True when the aircraft is behind the Pro upgrade. */
  pro: boolean;
  /** Livery display name + accent color used for the 3D model. */
  livery: string;
  liveryColor: string;
  description: string;
}

export interface Runway {
  /** Runway designator, e.g. "13R". */
  ident: string;
  lengthFt: number;
  /** Magnetic heading of the runway direction, degrees. */
  headingDeg: number;
  surface: string;
}

export interface Airport {
  /** ICAO code, e.g. "KJFK". */
  icao: string;
  /** IATA code, e.g. "JFK". */
  iata: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  elevationFt: number;
  /** True for the major hubs shown first in the catalog. */
  featured: boolean;
  /** Longest open runways, longest first. */
  runways: Runway[];
}

export const CATEGORY_LABELS: Record<AircraftCategory, string> = {
  ga: 'General Aviation',
  regional: 'Regional',
  narrowbody: 'Narrowbody',
  widebody: 'Widebody',
  legend: 'Legend',
};
