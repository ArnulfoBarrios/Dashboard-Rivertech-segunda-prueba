import { Activity, Fuel, Gauge, Route, Timer, TrendingUp } from 'lucide-react';
import { useMemo, type ChangeEvent, type CSSProperties } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { clamp, formatDuration, formatNumber } from '../../lib/format';
import { buildEfficiencySeries } from '../../lib/telemetry';
import type { FleetUnit } from '../../types/telemetry';
import { HudPanel } from '../common/HudPanel';
import { MetricCard } from '../common/MetricCard';

interface EfficiencyDashboardProps {
  fleet: FleetUnit[];
  selectedDeviceId: string | null;
  onSelect: (deviceId: string) => void;
}

export function EfficiencyDashboard({ fleet, selectedDeviceId, onSelect }: EfficiencyDashboardProps) {
  const selectedUnit = fleet.find((unit) => unit.deviceId === selectedDeviceId) ?? fleet[0];
  const series = useMemo(() => buildEfficiencySeries(selectedUnit), [selectedUnit]);

  const metrics = useMemo(() => {
    if (series.length === 0) {
      return { maxSpeed: 0, avgSpeed: 0, avgAcceleration: 0, duration: 0, distance: 0, fuel: null, kineticScore: 0 };
    }
    const speeds = series.map((point) => point.speedKmh);
    const accelerations = series
      .map((point) => point.acceleration)
      .filter((value): value is number => value != null);
    const fuelValues = series
      .map((point) => point.fuelRaw)
      .filter((value): value is number => value != null && value > 0);
    const duration = Math.max(0, (series[series.length - 1]!.timestamp - series[0]!.timestamp) / 1000);
    const distanceMeters = selectedUnit?.history.reduce(
      (sum, record) => sum + Math.max(0, record.attributes.distance ?? 0),
      0,
    ) ?? 0;
    const avgAbsAcceleration = accelerations.length
      ? accelerations.reduce((sum, value) => sum + Math.abs(value), 0) / accelerations.length
      : 0;
    const stationaryRatio = speeds.filter((speed) => speed < 1).length / speeds.length;
    const kineticScore = clamp(100 - avgAbsAcceleration * 18 - stationaryRatio * 25, 0, 100);

    return {
      maxSpeed: Math.max(...speeds),
      avgSpeed: speeds.reduce((sum, value) => sum + value, 0) / speeds.length,
      avgAcceleration: accelerations.length
        ? accelerations.reduce((sum, value) => sum + value, 0) / accelerations.length
        : 0,
      duration,
      distance: distanceMeters / 1000,
      fuel: fuelValues.length
        ? fuelValues.reduce((sum, value) => sum + value, 0) / fuelValues.length
        : null,
      kineticScore,
    };
  }, [selectedUnit, series]);

  const accelerationSeries = series.map((point) => ({
    ...point,
    acceleration: point.acceleration == null ? null : Number(point.acceleration.toFixed(3)),
  }));

  if (!selectedUnit) {
    return <div className="empty-state empty-state--large">No hay unidades disponibles.</div>;
  }

  return (
    <div className="dashboard-stack">
      <div className="dashboard-toolbar">
        <label className="select-control">
          <span>UNIDAD CINÉTICA</span>
          <select value={selectedUnit.deviceId} onChange={(event: ChangeEvent<HTMLSelectElement>) => onSelect(event.target.value)}>
            {fleet.map((unit) => (
              <option key={unit.deviceId} value={unit.deviceId}>{unit.name} // {unit.deviceId}</option>
            ))}
          </select>
        </label>
        <div className="toolbar-readout">
          <span>MUESTRAS ANALIZADAS</span>
          <strong>{series.length}</strong>
        </div>
      </div>

      <div className="metric-grid metric-grid--six">
        <MetricCard label="VELOCIDAD MÁX." value={formatNumber(metrics.maxSpeed, ' km/h')} helper="Conversión desde nudos" icon={<Gauge size={18} />} />
        <MetricCard label="VELOCIDAD PROM." value={formatNumber(metrics.avgSpeed, ' km/h')} helper={formatNumber(metrics.avgSpeed / 1.852, ' kn')} icon={<TrendingUp size={18} />} tone="green" />
        <MetricCard label="ACELERACIÓN PROM." value={formatNumber(metrics.avgAcceleration, ' m/s²')} helper="Derivada temporal" icon={<Activity size={18} />} />
        <MetricCard label="DISTANCIA REPORTADA" value={formatNumber(metrics.distance, ' km')} helper="Suma de attributes.distance" icon={<Route size={18} />} />
        <MetricCard label="VENTANA TEMPORAL" value={formatDuration(metrics.duration)} helper="Entre primera y última muestra" icon={<Timer size={18} />} />
        <MetricCard label="SEÑAL DE COMBUSTIBLE" value={metrics.fuel == null ? 'SIN SEÑAL' : formatNumber(metrics.fuel)} helper="Valor ECU sin unidad asumida" icon={<Fuel size={18} />} tone={metrics.fuel == null ? 'muted' : 'magenta'} />
      </div>

      <div className="efficiency-layout">
        <HudPanel eyebrow="KINETIC PROFILE" title="Curva de velocidad" className="speed-chart-panel">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 12, right: 16, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(0,240,255,.12)" strokeDasharray="3 5" />
                <XAxis dataKey="time" stroke="#61758b" tick={{ fontSize: 10 }} minTickGap={30} />
                <YAxis stroke="#61758b" tick={{ fontSize: 10 }} unit=" km/h" />
                <Tooltip contentStyle={{ background: '#07101c', border: '1px solid #00f0ff55', fontFamily: 'JetBrains Mono' }} />
                <Area type="monotone" dataKey="speedKmh" name="Velocidad" stroke="#00f0ff" fill="url(#speedGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </HudPanel>

        <HudPanel eyebrow="EFFICIENCY PROXY" title="Índice de estabilidad" className="score-panel" accent="green">
          <div className="kinetic-score">
            <div className="kinetic-score__ring" style={{ '--score': `${metrics.kineticScore * 3.6}deg` } as CSSProperties}>
              <div><strong>{Math.round(metrics.kineticScore)}</strong><span>/100</span></div>
            </div>
            <p>Proxy basado en suavidad de aceleración y proporción de detenciones. No reemplaza el cálculo de consumo físico.</p>
            <dl>
              <div><dt>POWER INPUT</dt><dd>{formatNumber(selectedUnit.latest.attributes.power, ' V')}</dd></div>
              <div><dt>MOTION</dt><dd>{selectedUnit.latest.attributes.motion ? 'TRUE' : 'FALSE'}</dd></div>
              <div><dt>IGNITION</dt><dd>{selectedUnit.latest.attributes.ignition == null ? 'N/D' : selectedUnit.latest.attributes.ignition ? 'ON' : 'OFF'}</dd></div>
            </dl>
          </div>
        </HudPanel>
      </div>

      <HudPanel eyebrow="ACCELERATION VECTOR" title="Aceleración longitudinal">
        <div className="chart-container chart-container--medium">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accelerationSeries} margin={{ top: 12, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="rgba(0,255,102,.11)" strokeDasharray="3 5" />
              <XAxis dataKey="time" stroke="#61758b" tick={{ fontSize: 10 }} minTickGap={30} />
              <YAxis stroke="#61758b" tick={{ fontSize: 10 }} unit=" m/s²" />
              <ReferenceLine y={0} stroke="#61758b" />
              <Tooltip contentStyle={{ background: '#07101c', border: '1px solid #00ff6655', fontFamily: 'JetBrains Mono' }} />
              <Line type="monotone" dataKey="acceleration" name="Aceleración" stroke="#00ff66" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HudPanel>
    </div>
  );
}
