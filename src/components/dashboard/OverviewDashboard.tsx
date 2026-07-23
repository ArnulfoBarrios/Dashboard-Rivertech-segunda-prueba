import { useMemo } from 'react';
import { 
  Ship, 
  Navigation, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  Compass, 
  TrendingUp, 
  Activity, 
  Zap,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import type { FleetUnit, TelemetryRecord } from '../../types/telemetry';

interface OverviewDashboardProps {
  fleet: FleetUnit[];
  records: TelemetryRecord[];
  onSelectUnit: (deviceId: string) => void;
  onNavigateToMap: () => void;
}

export function OverviewDashboard({
  fleet,
  records,
  onSelectUnit,
  onNavigateToMap,
}: OverviewDashboardProps) {
  // Calculate Fleet KPIs
  const totalUnits = fleet.length;
  const inMotionUnits = fleet.filter((u) => u.state === 'moving').length;
  const idleUnits = fleet.filter((u) => u.state === 'idle').length;
  const alertUnits = fleet.filter((u) => u.state === 'alert' || (u.latest.attributes.power ?? 12) < 11.5).length;

  // Pie chart data for fleet state distribution
  const pieData = useMemo(() => [
    { name: 'En Navegación', value: inMotionUnits, color: '#16a34a' },
    { name: 'Atracado / Ralentí', value: idleUnits, color: '#2563eb' },
    { name: 'Alerta de Hardware', value: alertUnits, color: '#dc2626' },
  ], [inMotionUnits, idleUnits, alertUnits]);

  // Top 5 fastest vessels
  const topFastestVessels = useMemo(() => {
    return [...fleet]
      .sort((a, b) => b.latest.speedKnots - a.latest.speedKnots)
      .slice(0, 5)
      .map((u) => ({
        name: u.name,
        speed: parseFloat(u.latest.speedKnots.toFixed(1)),
        sector: u.latest.attributes.locationDescription || u.latest.location || 'N/A',
      }));
  }, [fleet]);

  // Activity feed from latest logs
  const recentLogs = useMemo(() => {
    return records.slice(0, 6);
  }, [records]);

  // Sector breakdown
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    fleet.forEach((u) => {
      const sector = u.latest.attributes.locationDescription || 'Canal / Tramo Principal';
      counts[sector] = (counts[sector] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [fleet]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 4 Stat Metric Cards */}
      <div className="stat-card-grid">
        {/* Stat 1 */}
        <div className="stat-widget" style={{ '--widget-accent': 'var(--accent-blue-primary)', '--widget-bg': 'rgba(37, 99, 235, 0.1)' } as React.CSSProperties}>
          <div className="stat-top">
            <div className="stat-icon-badge">
              <Ship size={22} />
            </div>
            <div className="stat-trend is-up">
              <TrendingUp size={12} />
              <span>100% Sincronizado</span>
            </div>
          </div>
          <div>
            <div className="stat-value">{totalUnits}</div>
            <div className="stat-label">Unidades de Flota Activas</div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="stat-widget" style={{ '--widget-accent': 'var(--accent-emerald)', '--widget-bg': 'rgba(22, 163, 74, 0.1)' } as React.CSSProperties}>
          <div className="stat-top">
            <div className="stat-icon-badge">
              <Navigation size={22} />
            </div>
            <div className="stat-trend is-up">
              <TrendingUp size={12} />
              <span>{Math.round((inMotionUnits / (totalUnits || 1)) * 100)}%</span>
            </div>
          </div>
          <div>
            <div className="stat-value">{inMotionUnits}</div>
            <div className="stat-label">Embarcaciones en Navegación</div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="stat-widget" style={{ '--widget-accent': 'var(--accent-cyan)', '--widget-bg': 'rgba(2, 132, 199, 0.1)' } as React.CSSProperties}>
          <div className="stat-top">
            <div className="stat-icon-badge">
              <Clock size={22} />
            </div>
            <div className="stat-trend">
              <span>{idleUnits} Estáticas</span>
            </div>
          </div>
          <div>
            <div className="stat-value">{idleUnits}</div>
            <div className="stat-label">Atracadas / Motor en Ralentí</div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="stat-widget" style={{ '--widget-accent': 'var(--accent-rose)', '--widget-bg': 'rgba(220, 38, 38, 0.1)' } as React.CSSProperties}>
          <div className="stat-top">
            <div className="stat-icon-badge">
              <AlertTriangle size={22} />
            </div>
            <div className={`stat-trend ${alertUnits > 0 ? 'is-down' : 'is-up'}`}>
              <span>{alertUnits > 0 ? 'Atención Requerida' : 'Nominal'}</span>
            </div>
          </div>
          <div>
            <div className="stat-value">{alertUnits}</div>
            <div className="stat-label">Alertas Operativas</div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts & Distribution */}
      <div className="grid-7-3-col">
        {/* Top Speed Vessels Chart */}
        <div className="darkone-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title-icon">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="card-title">Ranking de Velocidad de la Flota</h3>
                <p className="card-subtitle">Mayores velocidades registradas en nudos (kn)</p>
              </div>
            </div>
            <button type="button" className="btn-darkone-outline" onClick={onNavigateToMap}>
              <Compass size={14} />
              <span>Ver Mapa Táctico</span>
            </button>
          </div>
          <div className="card-body" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topFastestVessels} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
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
                <Bar dataKey="speed" name="Velocidad (nudos)" fill="url(#blueGradient)" radius={[6, 6, 0, 0]}>
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Distribution Donut */}
        <div className="darkone-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title-icon">
                <PieChartIcon size={18} />
              </div>
              <div>
                <h3 className="card-title">Distribución del Estado de Flota</h3>
                <p className="card-subtitle">Desglose operativo actual</p>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px' }}>
              {pieData.map((item) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                  <span>{item.name}: <strong>{item.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Live Telemetry Feed & Sector Activity */}
      <div className="grid-6-4-col">
        {/* Recent Telemetry Activity Table */}
        <div className="darkone-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title-icon" style={{ background: 'rgba(22, 163, 74, 0.1)', color: 'var(--accent-emerald)' }}>
                <Zap size={18} />
              </div>
              <div>
                <h3 className="card-title">Feed de Actividad de Telemetría en Vivo</h3>
                <p className="card-subtitle">Paquetes recibidos recientemente de la flota fluvial</p>
              </div>
            </div>
          </div>
          <div className="darkone-table-container">
            <table className="darkone-table">
              <thead>
                <tr>
                  <th>Embarcación / Unidad</th>
                  <th>Hora del Registro</th>
                  <th>Velocidad</th>
                  <th>Rumbo</th>
                  <th>Tramo Fluvial</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => {
                  const speed = parseFloat(String(log.speedKnots || 0)).toFixed(1);
                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => onSelectUnit(log.deviceId)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.name}</td>
                      <td style={{ fontFamily: 'var(--mono-font)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {log.fixTime ? log.fixTime.split(' ')[1] : 'N/A'}
                      </td>
                      <td>
                        <span className={`status-badge ${parseFloat(speed) > 0 ? 'is-moving' : 'is-idle'}`}>
                          {speed} kn
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--mono-font)' }}>{log.cog}°</td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {log.attributes.locationDescription || log.location || 'Canal Principal'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Active River Sectors */}
        <div className="darkone-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title-icon" style={{ background: 'rgba(217, 119, 6, 0.1)', color: 'var(--accent-amber)' }}>
                <MapPin size={18} />
              </div>
              <div>
                <h3 className="card-title">Densidad de Tráfico por Sector Náutico</h3>
                <p className="card-subtitle">Mayor concentración de embarcaciones</p>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {sectorCounts.map((sector, idx) => (
              <div key={sector.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-primary)' }}>
                  <span style={{ fontWeight: 600 }}>{sector.name}</span>
                  <span style={{ color: 'var(--accent-blue-primary)', fontWeight: 700 }}>{sector.value} Unidades</span>
                </div>
                <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-element)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(sector.value / (totalUnits || 1)) * 100}%`,
                      background: idx % 2 === 0 
                        ? 'linear-gradient(90deg, #2563eb, #0284c7)' 
                        : 'linear-gradient(90deg, #16a34a, #0284c7)',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
