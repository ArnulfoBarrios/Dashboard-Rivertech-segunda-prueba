import {
  BatteryCharging,
  Compass,
  LocateFixed,
  Radio,
  Satellite,
  Search,
  ShipWheel,
  Zap,
} from 'lucide-react';
import { useMemo, useState, type ChangeEvent } from 'react';
import { formatCoordinate, formatDateTime, formatNumber } from '../../lib/format';
import type { FleetUnit } from '../../types/telemetry';
import { HudPanel } from '../common/HudPanel';
import { MetricCard } from '../common/MetricCard';
import { TacticalMap } from '../map/TacticalMap';

interface FleetDashboardProps {
  fleet: FleetUnit[];
  selectedDeviceId: string | null;
  onSelect: (deviceId: string) => void;
}

const STATE_LABELS: Record<FleetUnit['state'], string> = {
  alert: 'ALERTA',
  moving: 'EN MOVIMIENTO',
  idle: 'EN ESPERA',
  offline: 'FUERA DE LÍNEA',
};

export function FleetDashboard({ fleet, selectedDeviceId, onSelect }: FleetDashboardProps) {
  const [query, setQuery] = useState('');
  const selectedUnit = fleet.find((unit) => unit.deviceId === selectedDeviceId) ?? fleet[0];
  const filteredFleet = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return fleet;
    return fleet.filter(
      (unit) =>
        unit.name.toLowerCase().includes(normalized) || unit.deviceId.includes(normalized),
    );
  }, [fleet, query]);

  const moving = fleet.filter((unit) => unit.state === 'moving').length;
  const alerts = fleet.filter((unit) => unit.state === 'alert').length;
  const engineUnits = fleet.filter((unit) => unit.hasEngineTelemetry).length;
  const avgSat = fleet
    .map((unit) => unit.latest.attributes.sat)
    .filter((value): value is number => value != null);
  const averageSatellites = avgSat.length
    ? avgSat.reduce((sum, value) => sum + value, 0) / avgSat.length
    : null;

  return (
    <div className="dashboard-stack">
      <div className="metric-grid metric-grid--four">
        <MetricCard label="UNIDADES DETECTADAS" value={String(fleet.length)} helper="IDs únicos" icon={<Radio size={18} />} />
        <MetricCard label="EN MOVIMIENTO" value={String(moving)} helper="Motion / speed > 0.5 kn" icon={<LocateFixed size={18} />} tone="green" />
        <MetricCard label="ALERTAS" value={String(alerts)} helper="Evento, alarma o AIS" icon={<Zap size={18} />} tone={alerts ? 'magenta' : 'muted'} />
        <MetricCard label="SATÉLITES PROM." value={formatNumber(averageSatellites)} helper={`${engineUnits} unidades con CAN-Bus`} icon={<Satellite size={18} />} />
      </div>

      <div className="fleet-layout">
        <HudPanel eyebrow="FLEET ROSTER" title="Unidades operativas" className="fleet-list-panel">
          <label className="search-field">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Buscar unidad</span>
            <input
              value={query}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
              placeholder="Buscar nombre o ID..."
            />
          </label>
          <div className="fleet-list">
            {filteredFleet.map((unit) => (
              <button
                key={unit.deviceId}
                type="button"
                className={`fleet-unit ${unit.deviceId === selectedUnit?.deviceId ? 'is-selected' : ''}`}
                onClick={() => onSelect(unit.deviceId)}
              >
                <span className={`status-dot status-dot--${unit.state}`} />
                <span className="fleet-unit__identity">
                  <strong>{unit.name}</strong>
                  <small>ID {unit.deviceId} // {STATE_LABELS[unit.state]}</small>
                </span>
                <span className="fleet-unit__speed">{formatNumber(unit.latest.speedKnots, ' kn')}</span>
              </button>
            ))}
          </div>
        </HudPanel>

        <HudPanel eyebrow="TACTICAL MAP" title="Comando geoespacial" className="map-panel">
          <TacticalMap fleet={fleet} selectedDeviceId={selectedUnit?.deviceId ?? null} onSelect={onSelect} />
        </HudPanel>

        <HudPanel eyebrow="UNIT INTEL" title={selectedUnit?.name ?? 'Sin selección'} className="unit-detail-panel" accent="green">
          {selectedUnit ? (
            <div className="unit-intel">
              <div className="unit-intel__heading">
                <div className={`unit-avatar unit-avatar--${selectedUnit.state}`}>
                  <ShipWheel size={28} />
                </div>
                <div>
                  <span>DEVICE {selectedUnit.deviceId}</span>
                  <strong>{STATE_LABELS[selectedUnit.state]}</strong>
                </div>
              </div>

              <dl className="intel-grid">
                <div><dt><Compass size={14} /> RUMBO</dt><dd>{formatNumber(selectedUnit.latest.cog, '°')}</dd></div>
                <div><dt><Zap size={14} /> VELOCIDAD</dt><dd>{formatNumber(selectedUnit.latest.speedKnots, ' kn')}</dd></div>
                <div><dt><BatteryCharging size={14} /> BATERÍA</dt><dd>{formatNumber(selectedUnit.latest.attributes.battery, ' V')}</dd></div>
                <div><dt><Zap size={14} /> ALIMENTACIÓN</dt><dd>{formatNumber(selectedUnit.latest.attributes.power, ' V')}</dd></div>
                <div><dt><Satellite size={14} /> SAT / RSSI</dt><dd>{formatNumber(selectedUnit.latest.attributes.sat)} / {formatNumber(selectedUnit.latest.attributes.rssi)}</dd></div>
                <div><dt><Radio size={14} /> ENCENDIDO</dt><dd>{selectedUnit.latest.attributes.ignition == null ? 'N/D' : selectedUnit.latest.attributes.ignition ? 'ON' : 'OFF'}</dd></div>
              </dl>

              <div className="coordinates-block">
                <span>POSICIÓN GPS</span>
                <strong>{formatCoordinate(selectedUnit.latest.latitude)}</strong>
                <strong>{formatCoordinate(selectedUnit.latest.longitude)}</strong>
              </div>

              <div className="intel-lines">
                <p><span>SECTOR</span>{selectedUnit.latest.attributes.locationDescription ?? selectedUnit.latest.location ?? 'SIN CLASIFICAR'}</p>
                <p><span>ÚLTIMO FIX</span>{formatDateTime(selectedUnit.latest.deviceTime)}</p>
                <p><span>CONVOY</span>{selectedUnit.latest.attributes.convoy ? 'CONFIGURADO' : 'NO REPORTADO'}</p>
                <p><span>VESSEL MODEL</span>{selectedUnit.latest.attributes.vessel ? 'DISPONIBLE' : 'NO REPORTADO'}</p>
              </div>
            </div>
          ) : (
            <div className="empty-state">No hay unidades válidas.</div>
          )}
        </HudPanel>
      </div>
    </div>
  );
}
