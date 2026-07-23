import { useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  UploadCloud, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Sun,
  Moon
} from 'lucide-react';
import type { ThemeMode } from '../../types/telemetry';

interface HeaderProps {
  onToggleSidebar: () => void;
  loading: boolean;
  recordsCount: number;
  unitsCount: number;
  fileName: string;
  onFileDrop: (file: File) => Promise<void>;
  onResetSample: () => Promise<void>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}

export function Header({
  onToggleSidebar,
  loading,
  recordsCount,
  unitsCount,
  fileName,
  onFileDrop,
  onResetSample,
  searchQuery,
  onSearchChange,
  themeMode,
  onToggleTheme,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const mockAlerts = [
    { id: 1, title: 'Alerta de Bajo Voltaje', device: 'WGW011', time: '16:03:26', type: 'warning' },
    { id: 2, title: 'Motor en Ralentí Detectado', device: 'cartagena', time: '16:02:42', type: 'info' },
    { id: 3, title: 'Geocerca Fluvial Activa', device: 'amamelodia', time: '16:01:15', type: 'success' },
  ];

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void onFileDrop(e.target.files[0]);
    }
  };

  return (
    <header className="darkone-header">
      {/* Left side: Toggle & Search */}
      <div className="header-left">
        <button
          type="button"
          className="toggle-sidebar-btn"
          onClick={onToggleSidebar}
          title="Abrir / Plegar Menú"
        >
          <Menu size={20} />
        </button>

        <div className="header-search">
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar embarcación o dispositivo..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Right side: Actions, Theme Switcher & Profile */}
      <div className="header-right">
        {/* Live Status Pill */}
        <div className="status-pill">
          <span className="pulse-dot" />
          <span>{loading ? 'PROCESANDO...' : 'EN VIVO'}</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ fontFamily: 'var(--mono-font)' }}>{recordsCount.toLocaleString('es-CO')} registros</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>{unitsCount} unidades</span>
        </div>

        {/* Theme Switcher Button */}
        <button
          type="button"
          className="header-action-btn"
          onClick={onToggleTheme}
          title={themeMode === 'light' ? 'Cambiar a Tema Oscuro' : 'Cambiar a Tema Claro (Azul y Blanco)'}
        >
          {themeMode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          <span>{themeMode === 'light' ? 'Tema Oscuro' : 'Tema Claro (Azul/Blanco)'}</span>
        </button>

        {/* File Drop / Load Action */}
        <label className="header-action-btn" title={`Archivo Cargado: ${fileName}. Clic para cargar JSON personalizado`}>
          <UploadCloud size={18} />
          <input
            type="file"
            accept=".json"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </label>

        {/* Reset Sample Button */}
        <button
          type="button"
          className="header-action-btn"
          onClick={() => void onResetSample()}
          title="Restablecer JSON Muestra de 1,000 registros"
        >
          <RotateCcw size={17} />
        </button>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="header-action-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Alertas y Notificaciones del Sistema"
          >
            <Bell size={18} />
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'var(--accent-rose)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              3
            </span>
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                width: '320px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-card)',
                padding: '16px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Alertas Operativas</strong>
                <span style={{ fontSize: '11px', color: 'var(--accent-blue-primary)', cursor: 'pointer' }}>Leídas</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mockAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'var(--bg-element)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    {alert.type === 'warning' ? (
                      <AlertTriangle size={16} style={{ color: 'var(--accent-rose)', marginTop: '2px' }} />
                    ) : (
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)', marginTop: '2px' }} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{alert.title}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {alert.device} • {alert.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Chip */}
        <div className="user-profile-chip" title="Perfil del Operador">
          <div className="user-avatar">RT</div>
          <div className="user-meta">
            <span className="user-name">Comandante RT</span>
            <span className="user-role">Operador de Flota</span>
          </div>
        </div>
      </div>
    </header>
  );
}
