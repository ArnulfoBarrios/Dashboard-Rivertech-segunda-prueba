import { useState, useMemo } from 'react';
import { 
  Fuel, 
  Navigation, 
  Clock, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import type { FleetUnit } from '../../types/telemetry';

interface KineticDashboardProps {
  fleet: FleetUnit[];
  selectedDeviceId: string | null;
  onSelectUnit: (deviceId: string) => void;
}

export function KineticDashboard({
  fleet,
  selectedDeviceId,
  onSelectUnit,
}: KineticDashboardProps) {
  const [activeUnitId, setActiveUnitId] = useState<string>(selectedDeviceId || fleet[0]?.deviceId || '');

  const activeUnit = useMemo(() => {
    return fleet.find((u) => u.deviceId === activeUnitId) || fleet[0];
  }, [fleet, activeUnitId]);

  // Speed history chart data for active unit
  const speedHistory = useMemo(() => {
    if (!activeUnit) return [];
    return activeUnit.history.slice(-30).map((r, idx) => ({
      index: idx + 1,
      time: r.fixTime ? r.fixTime.split(' ')[1] : `Fix #${idx + 1}`,
      speed: parseFloat(r.speedKnots.toFixed(1)),
      distance: r.attributes.distance ? parseFloat((r.attributes.distance / 1000).toFixed(2)) : 0,
    }));
  }, [activeUnit]);

  // Engine idle units (ignition true, motion false or speed 0)
  const idleUnits = useMemo(() => {
    return fleet.filter((u) => {
      const ignition = u.latest.attributes.ignition ?? true;
      return ignition && u.latest.speedKnots === 0;
    });
  }, [fleet]);

  // Total Fleet Distance
  const totalFleetDistanceKm = useMemo(() => {
    const totalMeters = fleet.reduce((acc, u) => acc + (u.latest.attributes.totalDistance || 0), 0);
    return Math.round(totalMeters / 1000);
  }, [fleet]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 3 Kinetic & Fuel KPI Widgets */}
      <div className="grid-3-col">
        {/* Widget 1 */}
        <div className="stat-widget" style={{ '--widget-accent': 'var(--accent-blue-primary)', '--widget-bg': 'rgba(37, 99, 235, 0.1)' } as React.CSSProperties}>
          <div className="stat-top">
            <div className="stat-icon-badge">
              <Fuel size={22} />
            </div>
            <div className="stat-trend is-up">
              <TrendingUp size={12} />
              <span>Total Flota</span>
            </div>
          </div>
          <div>
            <div className="stat-value">{totalFleetDistanceKm.toLocaleString('es-CO')} km</div>
            <div className="stat-label">Distancia Acumulada Odómetro</div>
          </div>
        </div>

        {/* Widget 2 */}
        <div className="stat-widget" style={{ '--widget-accent': 'var(--accent-emerald)', '--widget-bg': 'rgba(22, 163, 74, 0.1)' } as React.CSSProperties}>
          <div className="stat-top">
            <div className="stat-icon-badge">
              <Navigation size={22} />
            </div>
            <div className="stat-trend is-up">
              <span>Rango Óptimo</span>
            </div>
          </div>
          <div>
            <div className="stat-value">3.2 kn</div>
            <div className="stat-label">Velocidad Promedio de Crucero</div>
          </div>
        </div>

        {/* Widget 3 */}
        <div className="stat-widget" style={{ '--widget-accent': 'var(--accent-rose)', '--widget-bg': 'rgba(220, 38, 38, 0.1)' } as React.CSSProperties}>
          <div className="stat-top">
            <div className="stat-icon-badge">
              <Clock size={22} />
            </div>
            <div className="stat-trend is-down">
              <span>Posible Desperdicio</span>
            </div>
          </div>
          <div>
            <div className="stat-value">{idleUnits.length} Unidades</div>
            <div className="stat-label">Motores en Ralentí (Velocidad 0 nudos)</div>
          </div>
        </div>
      </div>

      {/* Row 2: Selected Vessel Speed Timeline & Vessel Picker */}
      <div className="grid-7-3-col">
        <div className="darkone-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title-icon">
                <Navigation size={18} />
              </div>
              <div>
                <h3 className="card-title">Perfil Cinético y Velocidad: {activeUnit?.name}</h3>
                <p className="card-subtitle">Variaciones de velocidad registradas en el historial (nudos)</p>
              </div>
            </div>

            {/* Select active unit dropdown */}
            <select
              value={activeUnitId}
              onChange={(e) => {
                setActiveUnitId(e.target.value);
                onSelectUnit(e.target.value);
              }}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
              }}
            >
              {fleet.map((u) => (
                <option key={u.deviceId} value={u.deviceId}>
                  {u.name} (#{u.deviceId})
                </option>
              ))}
            </select>
          </div>

          <div className="card-body" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={speedHistory} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="speedArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} unit=" kn" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="speed" name="Velocidad (nudos)" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#speedArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Idling Warning Panel */}
        <div className="darkone-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent-rose)' }}>
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 className="card-title">Alerta de Motores en Ralentí</h3>
                <p className="card-subtitle">Embarcaciones detenidas con motor encendido</p>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
            {idleUnits.map((u) => (
              <div
                key={u.deviceId}
                onClick={() => {
                  setActiveUnitId(u.deviceId);
                  onSelectUnit(u.deviceId);
                }}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'var(--bg-element)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{u.name}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Sector: {u.latest.attributes.locationDescription || u.latest.location || 'Canal'}
                  </span>
                </div>
                <span className="status-badge is-idle">0.0 nudos</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
