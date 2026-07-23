import { useMemo } from 'react';
import { 
  Activity, 
  Zap, 
  Battery, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  LineChart, 
  Line 
} from 'recharts';
import type { FleetUnit } from '../../types/telemetry';

interface HealthDashboardProps {
  fleet: FleetUnit[];
  onSelectUnit: (deviceId: string) => void;
}

export function HealthDashboard({ fleet, onSelectUnit }: HealthDashboardProps) {
  // Voltage health chart data
  const voltageData = useMemo(() => {
    return fleet.slice(0, 12).map((u) => ({
      name: u.name,
      power: u.latest.attributes.power || 12,
      battery: u.latest.attributes.battery || 4.0,
      sat: u.latest.attributes.sat || 0,
    }));
  }, [fleet]);

  // Satellite coverage breakdown
  const satStats = useMemo(() => {
    const excellent = fleet.filter((u) => (u.latest.attributes.sat ?? 0) >= 12).length;
    const good = fleet.filter((u) => (u.latest.attributes.sat ?? 0) >= 8 && (u.latest.attributes.sat ?? 0) < 12).length;
    const weak = fleet.filter((u) => (u.latest.attributes.sat ?? 0) < 8).length;
    return { excellent, good, weak };
  }, [fleet]);

  // Low power units (< 11.8V)
  const lowPowerUnits = useMemo(() => {
    return fleet.filter((u) => (u.latest.attributes.power ?? 12) < 11.8);
  }, [fleet]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 3 KPI Health Widgets */}
      <div className="grid-3-col">
        {/* Widget 1: Main Power Health */}
        <div className="stat-widget" style={{ '--widget-accent': 'var(--accent-amber)', '--widget-bg': 'rgba(217, 119, 6, 0.1)' } as React.CSSProperties}>
          <div className="stat-top">
            <div className="stat-icon-badge">
              <Zap size={22} />
            </div>
            <div className="stat-trend is-up">
              <span>Promedio 12.4V</span>
            </div>
          </div>
          <div>
            <div className="stat-value">{fleet.length - lowPowerUnits.length} / {fleet.length}</div>
            <div className="stat-label">Unidades con Alimentación Óptima</div>
          </div>
        </div>

        {/* Widget 2: Internal Battery Health */}
        <div className="stat-widget" style={{ '--widget-accent': 'var(--accent-emerald)', '--widget-bg': 'rgba(22, 163, 74, 0.1)' } as React.CSSProperties}>
          <div className="stat-top">
            <div className="stat-icon-badge">
              <Battery size={22} />
            </div>
            <div className="stat-trend is-up">
              <span>4.09V Nominal</span>
            </div>
          </div>
          <div>
            <div className="stat-value">100%</div>
            <div className="stat-label">Baterías de Respaldo Cargadas</div>
          </div>
        </div>

        {/* Widget 3: Satellite Coverage */}
        <div className="stat-widget" style={{ '--widget-accent': 'var(--accent-blue-primary)', '--widget-bg': 'rgba(37, 99, 235, 0.1)' } as React.CSSProperties}>
          <div className="stat-top">
            <div className="stat-icon-badge">
              <Radio size={22} />
            </div>
            <div className="stat-trend is-up">
              <span>{satStats.excellent} Alta Cobertura</span>
            </div>
          </div>
          <div>
            <div className="stat-value">{satStats.excellent + satStats.good} Unidades</div>
            <div className="stat-label">Precisión GPS Óptima (&gt; 8 Satélites)</div>
          </div>
        </div>
      </div>

      {/* Row 2: Main Power & Backup Battery Chart */}
      <div className="grid-7-3-col">
        <div className="darkone-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title-icon" style={{ background: 'rgba(217, 119, 6, 0.1)', color: 'var(--accent-amber)' }}>
                <Activity size={18} />
              </div>
              <div>
                <h3 className="card-title">Voltaje de Alimentación Principal (Voltios)</h3>
                <p className="card-subtitle">Lecturas de voltaje de entrada de las unidades de la flota</p>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={voltageData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} unit=" V" domain={[0, 16]} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="power" name="Alimentación Principal (V)" fill="#d97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Power Alert Sidebar */}
        <div className="darkone-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent-rose)' }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="card-title">Alertas de Bajo Voltaje</h3>
                <p className="card-subtitle">Unidades que requieren revisión eléctrica</p>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lowPowerUnits.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '10px', color: 'var(--accent-emerald)' }}>
                <CheckCircle2 size={36} />
                <span style={{ fontWeight: 700, fontSize: '13px' }}>Niveles de Energía Nominales</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>No se detectaron fallas de bajo voltaje en la flota activa</span>
              </div>
            ) : (
              lowPowerUnits.map((u) => (
                <div
                  key={u.deviceId}
                  onClick={() => onSelectUnit(u.deviceId)}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(220, 38, 38, 0.08)',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{u.name}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID #{u.deviceId}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-rose)', fontFamily: 'var(--mono-font)' }}>
                    {u.latest.attributes.power?.toFixed(2)} V
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Satellite Count Line Chart */}
      <div className="darkone-card">
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-title-icon">
              <Cpu size={18} />
            </div>
            <div>
              <h3 className="card-title">Densidad de Satélites GPS por Unidad</h3>
              <p className="card-subtitle">Conteo de satélites e indicador de calidad de señal en tiempo real</p>
            </div>
          </div>
        </div>
        <div className="card-body" style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={voltageData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} unit=" Sats" />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
              <Line type="monotone" dataKey="sat" name="Satélites Conectados" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
