import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { TacticalMapView } from './components/dashboard/TacticalMapView';
import { FleetTableView } from './components/dashboard/FleetTableView';
import { HealthDashboard } from './components/dashboard/HealthDashboard';
import { KineticDashboard } from './components/dashboard/KineticDashboard';

import { useTelemetryFile } from './hooks/useTelemetryFile';
import type { DashboardId, ThemeMode } from './types/telemetry';

export function App() {
  const { records, fleet, error, resetSample } = useTelemetryFile();
  const [currentDashboard, setCurrentDashboard] = useState<DashboardId>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  // Default selected vessel
  useEffect(() => {
    if (fleet.length > 0 && (!selectedDeviceId || !fleet.some((u) => u.deviceId === selectedDeviceId))) {
      setSelectedDeviceId(fleet[0]?.deviceId ?? null);
    }
  }, [fleet, selectedDeviceId]);

  // Sync data-theme attribute on body/root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  // Page titles map in Spanish
  const pageTitles: Record<DashboardId, { title: string; subtitle: string }> = {
    overview: {
      title: 'Resumen Ejecutivo de Comando de Flota',
      subtitle: 'Indicadores KPI en tiempo real, distribución operativo y feed de telemetría',
    },
    map: {
      title: 'Mapa Táctico Operativo 2D/3D',
      subtitle: 'Monitoreo vectorial en vivo con estilos Liberty (Claro), Fiord (Oscuro) y Vista 3D',
    },
    fleet: {
      title: 'Registro de Flota y Tabla de Activos',
      subtitle: 'Listado interactivo y buscable de todas las embarcaciones y unidades IoT',
    },
    health: {
      title: 'Salud de Hardware y Sensores IoT',
      subtitle: 'Diagnóstico de voltaje principal, batería de respaldo, satélites GPS y precisión HDOP',
    },
    kinetics: {
      title: 'Analítica de Combustible y Cinética',
      subtitle: 'Perfil de velocidad, odometría acumulada y alertas de motores en ralentí',
    },
  };

  return (
    <div className="darkone-layout" data-theme={themeMode}>
      {/* Sidebar */}
      <Sidebar
        currentDashboard={currentDashboard}
        onSelectDashboard={setCurrentDashboard}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        totalUnitsCount={fleet.length}
      />

      {/* Main Wrapper */}
      <div
        className="darkone-main-wrapper"
        style={{
          marginLeft: isSidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        }}
      >
        {/* Header */}
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
          themeMode={themeMode}
          onToggleTheme={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
          activeCount={fleet.length}
        />

        {/* Content Body */}
        <main className="darkone-content-body">
          {/* Error Banner if any */}
          {error && (
            <div
              style={{
                padding: '14px 20px',
                borderRadius: '12px',
                background: 'rgba(220, 38, 38, 0.12)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                color: 'var(--accent-rose)',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>⚠️ Error: {error}</span>
              <button
                type="button"
                className="btn-darkone-outline"
                onClick={() => void resetSample()}
                style={{ padding: '4px 12px', fontSize: '11px' }}
              >
                Reinventar Muestra
              </button>
            </div>
          )}

          {/* Page Header Title Row */}
          <div className="page-header-row">
            <div className="page-header-title">
              <h2>{pageTitles[currentDashboard].title}</h2>
              <p>{pageTitles[currentDashboard].subtitle}</p>
            </div>
          </div>

          {/* Active View Render */}
          {currentDashboard === 'overview' && (
            <OverviewDashboard
              fleet={fleet}
              records={records}
              onSelectUnit={setSelectedDeviceId}
              onNavigateToMap={() => setCurrentDashboard('map')}
            />
          )}

          {currentDashboard === 'map' && (
            <TacticalMapView
              fleet={fleet}
              selectedDeviceId={selectedDeviceId}
              onSelectUnit={setSelectedDeviceId}
            />
          )}

          {currentDashboard === 'fleet' && (
            <FleetTableView
              fleet={fleet}
              onSelectUnit={(id) => {
                setSelectedDeviceId(id);
                setCurrentDashboard('map');
              }}
            />
          )}

          {currentDashboard === 'health' && (
            <HealthDashboard
              fleet={fleet}
              onSelectUnit={(id) => {
                setSelectedDeviceId(id);
                setCurrentDashboard('map');
              }}
            />
          )}

          {currentDashboard === 'kinetics' && (
            <KineticDashboard
              fleet={fleet}
              selectedDeviceId={selectedDeviceId}
              onSelectUnit={setSelectedDeviceId}
            />
          )}
        </main>

        {/* Footer */}
        <footer
          style={{
            height: '42px',
            borderTop: '1px solid var(--border-subtle)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-muted)',
            background: 'var(--bg-sidebar)',
          }}
        >
          <span>RIVERTECH COMANDO FLUVIAL v2.5 // TEMA CLARO AZUL Y BLANCO</span>
          <span>SISTEMA DE TELEMETRÍA NÁUTICA // {fleet.length} EMBARCACIONES</span>
        </footer>
      </div>
    </div>
  );
}
