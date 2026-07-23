import type {
  FleetUnit,
  NormalizedAttributes,
  NormalizedTelemetry,
  RawTelemetryRecord,
  TelemetryRecord,
} from '../types/telemetry';

const KNOT_TO_KMH = 1.852;

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = toNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return null;
}

function parseEmbeddedObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== 'string' || value.trim() === '') return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function parseTimestamp(value: string | null | undefined, fallbackId: unknown): number {
  if (value) {
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const parsed = Date.parse(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return toNumber(fallbackId, 0);
}

function normalizeTelemetryObject(value: unknown): NormalizedTelemetry | null {
  const source = parseEmbeddedObject(value);
  if (!source) return null;

  const result: NormalizedTelemetry = {};
  let numericCount = 0;
  for (const [key, rawValue] of Object.entries(source)) {
    const numeric = toNullableNumber(rawValue);
    result[key] = numeric;
    if (numeric != null) numericCount += 1;
  }
  return numericCount > 0 ? result : null;
}

function normalizeAttributes(value: unknown): NormalizedAttributes {
  const raw = parseEmbeddedObject(value) ?? {};
  const systemStatus = parseEmbeddedObject(raw.status);

  return {
    motion: toNullableBoolean(raw.motion),
    ignition: toNullableBoolean(raw.ignition),
    battery: toNullableNumber(raw.battery),
    power: toNullableNumber(raw.power),
    sat: toNullableNumber(raw.sat),
    hdop: toNullableNumber(raw.hdop),
    rssi: toNullableNumber(raw.rssi),
    distance: toNullableNumber(raw.distance),
    totalDistance: toNullableNumber(raw.totalDistance),
    odometer: toNullableNumber(raw.odometer),
    alarm: typeof raw.alarm === 'string' ? raw.alarm : null,
    locationDescription:
      typeof raw.locationDescription === 'string' ? raw.locationDescription : null,
    vessel: parseEmbeddedObject(raw.vessel),
    convoy: parseEmbeddedObject(raw.convoy),
    position: parseEmbeddedObject(raw.position),
    systemStatus,
    raw,
  };
}

function normalizeRecord(raw: RawTelemetryRecord, index: number): TelemetryRecord | null {
  const latitude = toNumber(raw.latitude, Number.NaN);
  const longitude = toNumber(raw.longitude, Number.NaN);
  const deviceId = String(raw.deviceid ?? '').trim();
  if (!deviceId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const attributes = normalizeAttributes(raw.attributes);
  const telemetry =
    normalizeTelemetryObject(raw.telemetry) ?? normalizeTelemetryObject(attributes.raw.emi);
  const speedKnots = Math.max(0, toNumber(raw.speed));
  const deviceTime = typeof raw.devicetime === 'string' ? raw.devicetime : null;
  const serverTime = typeof raw.servertime === 'string' ? raw.servertime : null;
  const fixTime = typeof raw.fixtime === 'string' ? raw.fixtime : null;

  return {
    id: String(raw.id ?? `${deviceId}-${index}`),
    deviceId,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : `UNIT-${deviceId}`,
    serverTime,
    deviceTime,
    fixTime,
    timestampMs: parseTimestamp(deviceTime ?? serverTime ?? fixTime, raw.id ?? index),
    speedKnots,
    speedKmh: speedKnots * KNOT_TO_KMH,
    cog: ((toNumber(raw.cog) % 360) + 360) % 360,
    latitude,
    longitude,
    altitude: toNullableNumber(raw.altitude),
    status: typeof raw.status === 'string' ? raw.status.toLowerCase() : 'unknown',
    location: typeof raw.location === 'string' ? raw.location : null,
    event: raw.event == null ? null : String(raw.event),
    attributes,
    telemetry,
    raw,
  };
}

function unwrapRecords(input: unknown): RawTelemetryRecord[] {
  if (Array.isArray(input)) return input as RawTelemetryRecord[];
  if (!input || typeof input !== 'object') return [];

  const candidate = input as Record<string, unknown>;
  for (const key of ['data', 'records', 'positions', 'items', 'result']) {
    if (Array.isArray(candidate[key])) return candidate[key] as RawTelemetryRecord[];
  }
  return [];
}

export function normalizeDataset(input: unknown): TelemetryRecord[] {
  return unwrapRecords(input)
    .map((record, index) => normalizeRecord(record, index))
    .filter((record): record is TelemetryRecord => record !== null)
    .sort((a, b) => a.timestampMs - b.timestampMs || Number(a.id) - Number(b.id));
}

function unitState(record: TelemetryRecord): FleetUnit['state'] {
  const ais = record.attributes.systemStatus?.ais;
  const aisAlarms =
    ais && typeof ais === 'object' && !Array.isArray(ais)
      ? toNumber((ais as Record<string, unknown>).alarms)
      : 0;
  const eventIsAlert = record.event != null && record.event !== '0';
  if (record.attributes.alarm || aisAlarms > 0 || eventIsAlert) return 'alert';
  if (record.status !== 'active') return 'offline';
  if (record.attributes.motion || record.speedKnots > 0.5) return 'moving';
  return 'idle';
}

export function buildFleet(records: TelemetryRecord[]): FleetUnit[] {
  const byDevice = new Map<string, TelemetryRecord[]>();
  for (const record of records) {
    const history = byDevice.get(record.deviceId) ?? [];
    history.push(record);
    byDevice.set(record.deviceId, history);
  }

  return [...byDevice.entries()]
    .map(([deviceId, history]): FleetUnit => {
      history.sort((a, b) => a.timestampMs - b.timestampMs || Number(a.id) - Number(b.id));
      const latest = history[history.length - 1] as TelemetryRecord;
      return {
        deviceId,
        name: latest.name,
        latest,
        history,
        state: unitState(latest),
        hasEngineTelemetry: history.some((record) => record.telemetry !== null),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function getTelemetryValue(
  telemetry: NormalizedTelemetry | null,
  key: string,
): number | null {
  const value = telemetry?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function getEngineCount(unit: FleetUnit | undefined): number {
  if (!unit) return 0;
  const telemetryRecord = [...unit.history].reverse().find((record) => record.telemetry);
  if (!telemetryRecord?.telemetry) return 0;
  let count = 0;
  for (let engine = 1; engine <= 6; engine += 1) {
    const hasAny = ['ect', 'eot', 'rpm', 'vol', 'load'].some(
      (prefix) => getTelemetryValue(telemetryRecord.telemetry, `${prefix}${engine}`) != null,
    );
    if (hasAny) count = engine;
  }
  return count;
}

export function getLatestTelemetryRecord(unit: FleetUnit | undefined): TelemetryRecord | null {
  if (!unit) return null;
  return [...unit.history].reverse().find((record) => record.telemetry !== null) ?? null;
}

export interface EfficiencyPoint {
  id: string;
  timestamp: number;
  time: string;
  speedKmh: number;
  speedKnots: number;
  acceleration: number | null;
  power: number | null;
  fuelRaw: number | null;
}

function getRawFuelSignal(record: TelemetryRecord): number | null {
  if (!record.telemetry) return null;
  const preferredPrefixes = ['ifuel', 'cfuel', 'ofuel', 'rfuel', 'sfuel', 'tfuelecu', 'tfuel'];
  for (const prefix of preferredPrefixes) {
    const values = [1, 2, 3]
      .map((engine) => getTelemetryValue(record.telemetry, `${prefix}${engine}`))
      .filter((value): value is number => value != null);
    const sum = values.reduce((total, value) => total + value, 0);
    if (sum > 0) return sum;
  }
  return null;
}

export function buildEfficiencySeries(unit: FleetUnit | undefined): EfficiencyPoint[] {
  if (!unit) return [];
  const history = unit.history.slice(-240);
  return history.map((record, index) => {
    const previous = history[index - 1];
    let acceleration: number | null = null;
    if (previous) {
      const deltaSeconds = (record.timestampMs - previous.timestampMs) / 1000;
      if (deltaSeconds > 0 && deltaSeconds <= 300) {
        acceleration = (record.speedKmh / 3.6 - previous.speedKmh / 3.6) / deltaSeconds;
      }
    }
    return {
      id: record.id,
      timestamp: record.timestampMs,
      time: record.deviceTime?.slice(11, 19) ?? String(index + 1),
      speedKmh: record.speedKmh,
      speedKnots: record.speedKnots,
      acceleration,
      power: record.attributes.power,
      fuelRaw: getRawFuelSignal(record),
    };
  });
}
