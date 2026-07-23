import { Activity, Cpu, Gauge, Thermometer, Waves, Zap } from 'lucide-react';
import { useMemo, type ChangeEvent } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDateTime, formatNumber } from '../../lib/format';
import {
  getEngineCount,
  getLatestTelemetryRecord,
  getTelemetryValue,
} from '../../lib/telemetry';
import type { FleetUnit } from '../../types/telemetry';
import { HudGauge } from '../charts/HudGauge';
import { HudPanel } from '../common/HudPanel';
import { MetricCard } from '../common/MetricCard';

interface EngineDashboardProps {
  fleet: FleetUnit[];
  selectedDeviceId: string | null;
  onSelect: (deviceId: string) => void;
}

interface ChartPoint {
  time: string;
  ect1: number | null;
  ect2: number | null;
  ect3: number | null;
  eot1: number | null;
  eot2: number | null;
  eot3: number | null;
  rpm1: number | null;
  rpm2: number | null;
  rpm3: number | null;
}

export function EngineDashboard({ fleet, selectedDeviceId, onSelect }: EngineDashboardProps) {
  const candidates = fleet.filter((unit) => unit.hasEngineTelemetry);
  const selectedUnit =
    candidates.find((unit) => unit.deviceId === selectedDeviceId) ?? candidates[0];
  const latestRecord = getLatestTelemetryRecord(selectedUnit);
  const engineCount = Math.max(1, getEngineCount(selectedUnit));

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!selectedUnit) return [];
    return selectedUnit.history
      .filter((record) => record.telemetry)
      .slice(-120)
      .map((record) => ({
        time: record.deviceTime?.slice(11, 19) ?? record.id,
        ect1: getTelemetryValue(record.telemetry, 'ect1'),
        ect2: getTelemetryValue(record.telemetry, 'ect2'),
        ect3: getTelemetryValue(record.telemetry, 'ect3'),
        eot1: getTelemetryValue(record.telemetry, 'eot1'),
        eot2: getTelemetryValue(record.telemetry, 'eot2'),
        eot3: getTelemetryValue(record.telemetry, 'eot3'),
        rpm1: getTelemetryValue(record.telemetry, 'rpm1'),
        rpm2: getTelemetryValue(record.telemetry, 'rpm2'),
        rpm3: getTelemetryValue(record.telemetry, 'rpm3'),
      }));
  }, [selectedUnit]);

  const latestTelemetry = latestRecord?.telemetry ?? null;
  const maxCoolant = Math.max(
    0,
    ...[1, 2, 3].map((engine) => getTelemetryValue(latestTelemetry, `ect${engine}`) ?? 0),
  );
  const maxOil = Math.max(
    0,
    ...[1, 2, 3].map((engine) => getTelemetryValue(latestTelemetry, `eot${engine}`) ?? 0),
  );
  const totalRpm = [1, 2, 3].reduce(
    (sum, engine) => sum + (getTelemetryValue(latestTelemetry, `rpm${engine}`) ?? 0),
    0,
  );

  if (candidates.length === 0) {
    return (
      <HudPanel eyebrow="CAN-BUS" title="Sin telemetría de motores" accent="magenta">
        <div className="empty-state empty-state--large">
          <Cpu size={42} />
          <strong>No se detectaron bloques `telemetry` ni `attributes.emi`.</strong>
          <span>Carga un JSON que incluya ECT, EOT, RPM, VOL, LOAD o señales de combustible.</span>
        </div>
      </HudPanel>
    );
  }

  return (
    <div className="dashboard-stack">
      <div className="dashboard-toolbar">
        <label className="select-control">
          <span>UNIDAD CAN-BUS</span>
          <select value={selectedUnit?.deviceId} onChange={(event: ChangeEvent<HTMLSelectElement>) => onSelect(event.target.value)}>
            {candidates.map((unit) => (
              <option key={unit.deviceId} value={unit.deviceId}>{unit.name} // {unit.deviceId}</option>
            ))}
          </select>
        </label>
        <div className="toolbar-readout">
          <span>ÚLTIMO FRAME</span>
          <strong>{formatDateTime(latestRecord?.deviceTime ?? null)}</strong>
        </div>
      </div>

      <div className="metric-grid metric-grid--four">
        <MetricCard label="MOTORES DETECTADOS" value={String(engineCount)} helper="Canales ECU" icon={<Cpu size={18} />} />
        <MetricCard label="ECT MÁXIMO" value={formatNumber(maxCoolant, ' °C')} helper="Temperatura refrigerante" icon={<Thermometer size={18} />} tone={maxCoolant > 95 ? 'magenta' : 'green'} />
        <MetricCard label="EOT MÁXIMO" value={formatNumber(maxOil, ' °C')} helper="Temperatura de aceite" icon={<Waves size={18} />} tone={maxOil > 110 ? 'magenta' : 'cyan'} />
        <MetricCard label="RPM AGREGADO" value={formatNumber(totalRpm)} helper="Suma de canales" icon={<Gauge size={18} />} />
      </div>

      <div className="engine-layout">
        <HudPanel eyebrow="POWERTRAIN" title="Diagnóstico por motor" className="engine-bank-panel">
          <div className="engine-bank">
            {Array.from({ length: engineCount }, (_, index) => index + 1).map((engine) => (
              <article className="engine-module" key={engine}>
                <header>
                  <div><Cpu size={18} /><strong>ENGINE {String(engine).padStart(2, '0')}</strong></div>
                  <span className="module-online">LINKED</span>
                </header>
                <div className="engine-gauges">
                  <HudGauge label="COOLANT" value={getTelemetryValue(latestTelemetry, `ect${engine}`)} max={120} unit="°C" tone="cyan" />
                  <HudGauge label="OIL TEMP" value={getTelemetryValue(latestTelemetry, `eot${engine}`)} max={140} unit="°C" tone="magenta" />
                  <HudGauge label="RPM" value={getTelemetryValue(latestTelemetry, `rpm${engine}`)} max={3000} unit="rpm" tone="green" />
                </div>
                <div className="engine-strip">
                  <span><Zap size={14} /> VOL <strong>{formatNumber(getTelemetryValue(latestTelemetry, `vol${engine}`), ' V')}</strong></span>
                  <span><Activity size={14} /> LOAD <strong>{formatNumber(getTelemetryValue(latestTelemetry, `load${engine}`), ' %')}</strong></span>
                  <span><Waves size={14} /> OIL P <strong>{formatNumber(getTelemetryValue(latestTelemetry, `eop${engine}`))}</strong></span>
                </div>
              </article>
            ))}
          </div>
        </HudPanel>

        <HudPanel eyebrow="SIGNAL MATRIX" title="Estado de canales" className="signal-panel" accent="green">
          <div className="signal-matrix">
            {['ect', 'eot', 'rpm', 'vol', 'load', 'eop', 'efp', 'ifuel', 'tfuel'].map((prefix) => {
              const values = Array.from({ length: engineCount }, (_, index) =>
                getTelemetryValue(latestTelemetry, `${prefix}${index + 1}`),
              );
              const hasSignal = values.some((value) => value != null);
              return (
                <div key={prefix} className={hasSignal ? 'has-signal' : 'no-signal'}>
                  <span>{prefix.toUpperCase()}</span>
                  <strong>{hasSignal ? values.map((value) => formatNumber(value)).join(' / ') : 'NO DATA'}</strong>
                </div>
              );
            })}
          </div>
        </HudPanel>
      </div>

      <HudPanel eyebrow="ENGINE HISTORY" title="Temperatura y revoluciones">
        <div className="chart-container chart-container--large">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 18, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(0,240,255,.12)" strokeDasharray="3 5" />
              <XAxis dataKey="time" stroke="#61758b" tick={{ fontSize: 10 }} minTickGap={28} />
              <YAxis yAxisId="temp" stroke="#61758b" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="rpm" orientation="right" stroke="#61758b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#07101c', border: '1px solid #00f0ff55', fontFamily: 'JetBrains Mono' }} />
              <Legend />
              <Line yAxisId="temp" type="monotone" dataKey="ect1" name="ECT-1" stroke="#00f0ff" dot={false} connectNulls />
              <Line yAxisId="temp" type="monotone" dataKey="ect2" name="ECT-2" stroke="#00ff66" dot={false} connectNulls />
              <Line yAxisId="temp" type="monotone" dataKey="eot1" name="EOT-1" stroke="#ff0055" dot={false} connectNulls />
              <Line yAxisId="rpm" type="monotone" dataKey="rpm1" name="RPM-1" stroke="#f5d90a" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HudPanel>
    </div>
  );
}
