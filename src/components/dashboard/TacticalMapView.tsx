import { useState, useMemo } from 'react';
import { 
  Map, 
  Search, 
  Navigation, 
  Zap, 
  Compass, 
  Radio, 
  ShieldCheck, 
  Battery, 
  Info 
} from 'lucide-react';
import { OpenFreeMapContainer } from '../map/OpenFreeMapContainer';
import type { FleetUnit, MapStyle } from '../../types/telemetry';

interface TacticalMapViewProps {
  fleet: FleetUnit[];
  selectedDeviceId: string | null;
  onSelectUnit: (deviceId: string) => void;
}

export function TacticalMapView({
  fleet,
  selectedDeviceId,
  onSelectUnit,
}: TacticalMapViewProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [mapStyle, setMapStyle] = useState<MapStyle>('liberty');

  // Available unique sectors
  const availableSectors = useMemo(() => {
    const sectors = new Set<string>();
    fleet.forEach((u) => {
      const sec = u.latest.attributes.locationDescription || u.latest.location;
      if (sec) sectors.add(sec);
    });
    return Array.from(sectors);
  }, [fleet]);

  // Filtered fleet for map & list
  const filteredFleet = useMemo(() => {
    return fleet.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        u.deviceId.toLowerCase().includes(filterQuery.toLowerCase());
      const sec = u.latest.attributes.locationDescription || u.latest.location || '';
      const matchesSector = selectedSector === 'all' || sec === selectedSector;
      return matchesSearch && matchesSector;
    });
  }, [fleet, filterQuery, selectedSector]);

  const selectedUnit = useMemo(() => {
    return fleet.find((u) => u.deviceId === selectedDeviceId) || fleet[0];
  }, [fleet, selectedDeviceId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Control Bar Header */}
      <div className="darkone-card" style={{ padding: '16px 20px', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="card-title-icon">
            <Map size={18} />
          </div>
          <div>
            <h3 className="card-title">Mapa Táctico de Operaciones</h3>
            <p className="card-subtitle">Monitoreo vectorial en vivo con mapas Liberty (Claro), Fiord (Oscuro) y Vista 3D</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div className="header-search" style={{ width: '220px' }}>
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar embarcación..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>

          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            style={{
              height: '40px',
              padding: '0 14px',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
            }}
          >
            <option value="all">Todos los Tramos Fluviales ({availableSectors.length})</option>
            {availableSectors.map((sector) => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>

          <span className="status-badge is-moving">
            <Radio size={12} />
            <span>{filteredFleet.length} Embarcaciones Visualizadas</span>
          </span>
        </div>
      </div>

      {/* Main Map + Unit Inspector Split Grid */}
      <div className="grid-7-3-col">
        {/* Map Container Card */}
        <div className="darkone-card" style={{ height: '640px', padding: 0, overflow: 'hidden' }}>
          <OpenFreeMapContainer
            fleet={filteredFleet}
            selectedDeviceId={selectedDeviceId}
            onSelectUnit={onSelectUnit}
            mapStyle={mapStyle}
            onChangeMapStyle={setMapStyle}
          />
        </div>

        {/* Selected Vessel Inspector Side Card */}
        {selectedUnit && (
          <div className="darkone-card" style={{ height: '640px', overflowY: 'auto' }}>
            <div className="card-header">
              <div className="card-title-group">
                <div className="card-title-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="card-title">{selectedUnit.name}</h3>
                  <p className="card-subtitle">ID Dispositivo: #{selectedUnit.deviceId}</p>
                </div>
              </div>
              <span className={`status-badge is-${selectedUnit.state}`}>
                {selectedUnit.state === 'moving' ? 'EN NAVEGACIÓN' : selectedUnit.state === 'idle' ? 'ATRACADO / RALENTÍ' : 'ALERTA'}
              </span>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Speed & Heading Quick Widgets */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-element)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Navigation size={13} style={{ color: 'var(--accent-emerald)' }} />
                    Velocidad (nudos)
                  </span>
                  <strong style={{ fontSize: '20px', color: 'var(--text-primary)', fontFamily: 'var(--mono-font)' }}>
                    {selectedUnit.latest.speedKnots.toFixed(1)} kn
                  </strong>
                </div>

                <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-element)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Compass size={13} style={{ color: 'var(--accent-cyan)' }} />
                    Rumbo (COG)
                  </span>
                  <strong style={{ fontSize: '20px', color: 'var(--text-primary)', fontFamily: 'var(--mono-font)' }}>
                    {selectedUnit.latest.cog}°
                  </strong>
                </div>
              </div>

              {/* Position Coordinates */}
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.2)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-blue-primary)', letterSpacing: '0.08em' }}>
                  UBICACIÓN GPS Y TRAMO
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--mono-font)' }}>
                  {selectedUnit.latest.latitude.toFixed(6)}°, {selectedUnit.latest.longitude.toFixed(6)}°
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Sector: <strong>{selectedUnit.latest.attributes.locationDescription || selectedUnit.latest.location || 'Canal Principal de Navegación'}</strong>
                </span>
              </div>

              {/* Hardware Health Metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Hardware & Sensores IoT
                </span>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-element)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} style={{ color: 'var(--accent-amber)' }} />
                    Alimentación Principal
                  </span>
                  <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono-font)' }}>
                    {selectedUnit.latest.attributes.power ? `${selectedUnit.latest.attributes.power.toFixed(2)} V` : 'N/A'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-element)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Battery size={14} style={{ color: 'var(--accent-emerald)' }} />
                    Batería de Respaldo
                  </span>
                  <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono-font)' }}>
                    {selectedUnit.latest.attributes.battery ? `${selectedUnit.latest.attributes.battery.toFixed(2)} V` : 'N/A'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-element)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={14} style={{ color: 'var(--accent-cyan)' }} />
                    Satélites y Precisión
                  </span>
                  <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono-font)' }}>
                    {selectedUnit.latest.attributes.sat || 0} Sats (HDOP: {selectedUnit.latest.attributes.hdop || '0.6'})
                  </strong>
                </div>
              </div>

              {/* History count */}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                {selectedUnit.history.length} registros de telemetría procesados en el historial
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
