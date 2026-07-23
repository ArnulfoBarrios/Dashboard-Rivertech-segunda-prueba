const numberFormat = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 1,
});

export function formatNumber(value: number | null | undefined, suffix = ''): string {
  if (value == null || !Number.isFinite(value)) return 'N/D';
  return `${numberFormat.format(value)}${suffix}`;
}

export function formatCoordinate(value: number): string {
  return Number.isFinite(value) ? value.toFixed(6) : 'N/D';
}

export function formatDateTime(value: string | null): string {
  if (!value) return 'N/D';
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    hour12: false,
  }).format(date);
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return 'N/D';
  if (seconds < 60) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} h ${minutes} min`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
