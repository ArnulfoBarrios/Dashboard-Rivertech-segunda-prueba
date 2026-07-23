export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface RawTelemetryRecord {
  id?: number | string;
  deviceid?: number | string;
  name?: string;
  servertime?: string;
  devicetime?: string;
  fixtime?: string;
  speed?: number | string;
  cog?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  altitude?: number | string;
  status?: string;
  location?: string | null;
  event?: number | string | null;
  attributes?: Record<string, unknown> | null;
  telemetry?: Record<string, unknown> | null;
  created_at?: string;
  [key: string]: unknown;
}

export interface NormalizedAttributes {
  motion: boolean | null;
  ignition: boolean | null;
  battery: number | null;
  power: number | null;
  sat: number | null;
  hdop: number | null;
  rssi: number | null;
  distance: number | null;
  totalDistance: number | null;
  odometer: number | null;
  alarm: string | null;
  locationDescription: string | null;
  vessel: Record<string, unknown> | null;
  convoy: Record<string, unknown> | null;
  position: Record<string, unknown> | null;
  systemStatus: Record<string, unknown> | null;
  raw: Record<string, unknown>;
}

export interface NormalizedTelemetry {
  [key: string]: number | null;
}

export interface TelemetryRecord {
  id: string;
  deviceId: string;
  name: string;
  serverTime: string | null;
  deviceTime: string | null;
  fixTime: string | null;
  timestampMs: number;
  speedKnots: number;
  speedKmh: number;
  cog: number;
  latitude: number;
  longitude: number;
  altitude: number | null;
  status: string;
  location: string | null;
  event: string | null;
  attributes: NormalizedAttributes;
  telemetry: NormalizedTelemetry | null;
  raw: RawTelemetryRecord;
}

export interface FleetUnit {
  deviceId: string;
  name: string;
  latest: TelemetryRecord;
  history: TelemetryRecord[];
  state: 'alert' | 'moving' | 'idle' | 'offline';
  hasEngineTelemetry: boolean;
}

export type DashboardId = 'overview' | 'map' | 'fleet' | 'health' | 'kinetics';
export type MapStyle = 'liberty' | 'fiord' | '3d';
export type ThemeMode = 'light' | 'dark';


