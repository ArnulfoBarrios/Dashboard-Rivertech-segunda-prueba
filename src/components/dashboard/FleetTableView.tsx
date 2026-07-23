import { useState, useMemo } from 'react';
import { 
  Table2, 
  Search, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X 
} from 'lucide-react';
import type { FleetUnit } from '../../types/telemetry';

interface FleetTableViewProps {
  fleet: FleetUnit[];
  onSelectUnit: (deviceId: string) => void;
}

type SortField = 'name' | 'deviceId' | 'state' | 'speed' | 'power' | 'sat' | 'sector';
type SortOrder = 'asc' | 'desc';

export function FleetTableView({ fleet, onSelectUnit }: FleetTableViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('speed');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [inspectUnit, setInspectUnit] = useState<FleetUnit | null>(null);

  // Filter fleet units
  const filteredFleet = useMemo(() => {
    return fleet.filter((unit) => {
      const matchesSearch =
        unit.name.toLowerCase().includes(search.toLowerCase()) ||
        unit.deviceId.toLowerCase().includes(search.toLowerCase()) ||
        (unit.latest.attributes.locationDescription || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || unit.state === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [fleet, search, statusFilter]);

  // Sort fleet units
  const sortedFleet = useMemo(() => {
    return [...filteredFleet].sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      switch (sortField) {
        case 'name':
          valA = a.name;
          valB = b.name;
          break;
        case 'deviceId':
          valA = parseInt(a.deviceId, 10) || 0;
          valB = parseInt(b.deviceId, 10) || 0;
          break;
        case 'state':
          valA = a.state;
          valB = b.state;
          break;
        case 'speed':
          valA = a.latest.speedKnots;
          valB = b.latest.speedKnots;
          break;
        case 'power':
          valA = a.latest.attributes.power ?? 0;
          valB = b.latest.attributes.power ?? 0;
          break;
        case 'sat':
          valA = a.latest.attributes.sat ?? 0;
          valB = b.latest.attributes.sat ?? 0;
          break;
        case 'sector':
          valA = a.latest.attributes.locationDescription || '';
          valB = b.latest.attributes.locationDescription || '';
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredFleet, sortField, sortOrder]);

  // Paginated fleet units
  const totalPages = Math.ceil(sortedFleet.length / pageSize) || 1;
  const paginatedFleet = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedFleet.slice(start, start + pageSize);
  }, [sortedFleet, currentPage]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Table Controls & Filter Bar */}
      <div className="darkone-card" style={{ padding: '16px 20px', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="card-title-icon">
            <Table2 size={18} />
          </div>
          <div>
            <h3 className="card-title">Tabla de Registro de Flota y Telemetría</h3>
            <p className="card-subtitle">Listado completo de embarcaciones, sensores e indicadores operativos</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div className="header-search" style={{ width: '250px' }}>
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por barco, ID o sector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
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
            <option value="all">Todos los Estados Operativos</option>
            <option value="moving">En Navegación (En Movimiento)</option>
            <option value="idle">Atracado / Motor en Ralentí</option>
            <option value="alert">Alerta Operativa</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="darkone-card">
        <div className="darkone-table-container">
          <table className="darkone-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Nombre de la Nave</span>
                    {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th onClick={() => toggleSort('deviceId')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>ID Dispositivo</span>
                    {sortField === 'deviceId' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th onClick={() => toggleSort('state')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Estado</span>
                    {sortField === 'state' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th onClick={() => toggleSort('speed')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Velocidad (nudos)</span>
                    {sortField === 'speed' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th>Rumbo (COG)</th>
                <th onClick={() => toggleSort('power')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Alimentación (V)</span>
                    {sortField === 'power' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th onClick={() => toggleSort('sat')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Satélites GPS</span>
                    {sortField === 'sat' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th onClick={() => toggleSort('sector')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Tramo Fluvial</span>
                    {sortField === 'sector' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFleet.map((unit) => {
                const speed = unit.latest.speedKnots.toFixed(1);
                const power = unit.latest.attributes.power
                  ? `${unit.latest.attributes.power.toFixed(2)}V`
                  : 'N/A';
                const sat = unit.latest.attributes.sat ?? 0;

                return (
                  <tr key={unit.deviceId}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{unit.name}</td>
                    <td style={{ fontFamily: 'var(--mono-font)', color: 'var(--text-secondary)' }}>
                      #{unit.deviceId}
                    </td>
                    <td>
                      <span className={`status-badge is-${unit.state}`}>
                        {unit.state === 'moving' ? 'EN NAVEGACIÓN' : unit.state === 'idle' ? 'ATRACADO' : 'ALERTA'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--mono-font)', fontWeight: 700 }}>
                      {speed} kn
                    </td>
                    <td style={{ fontFamily: 'var(--mono-font)' }}>{unit.latest.cog}°</td>
                    <td style={{ fontFamily: 'var(--mono-font)', color: (unit.latest.attributes.power ?? 12) < 11.5 ? 'var(--accent-rose)' : 'inherit' }}>
                      {power}
                    </td>
                    <td style={{ fontFamily: 'var(--mono-font)' }}>
                      <span style={{ color: sat >= 10 ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontWeight: 700 }}>
                        {sat} Sats
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {unit.latest.attributes.locationDescription || unit.latest.location || 'Canal Principal'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-darkone-outline"
                        style={{ padding: '5px 12px', fontSize: '11px' }}
                        onClick={() => {
                          setInspectUnit(unit);
                          onSelectUnit(unit.deviceId);
                        }}
                      >
                        <Eye size={13} />
                        <span>Inspeccionar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="card-header" style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: 'none' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Mostrando {paginatedFleet.length} de {sortedFleet.length} unidades
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-darkone-outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{ padding: '6px 10px' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--mono-font)' }}>
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              className="btn-darkone-outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{ padding: '6px 10px' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Modal Drawer */}
      {inspectUnit && (
        <div className="notification-modal-overlay" onClick={() => setInspectUnit(null)}>
          <div className="notification-drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{inspectUnit.name}</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID Dispositivo IoT: #{inspectUnit.deviceId}</span>
              </div>
              <button
                type="button"
                className="toggle-sidebar-btn"
                onClick={() => setInspectUnit(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-element)', border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Velocidad</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--mono-font)' }}>
                    {inspectUnit.latest.speedKnots.toFixed(1)} kn
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Rumbo (COG)</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--mono-font)' }}>
                    {inspectUnit.latest.cog}°
                  </div>
                </div>
              </div>

              {/* Raw Attributes JSON breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue-primary)', textTransform: 'uppercase' }}>
                  Atributos de Telemetría JSON
                </span>
                <pre
                  style={{
                    background: 'var(--bg-app)',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--accent-blue-dark)',
                    fontSize: '11px',
                    fontFamily: 'var(--mono-font)',
                    overflowX: 'auto',
                    maxHeight: '300px',
                  }}
                >
                  {JSON.stringify(inspectUnit.latest.attributes, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
