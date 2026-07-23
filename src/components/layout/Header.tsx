import { Menu, Sun, Moon, Search, Radio } from 'lucide-react';
import type { ThemeMode } from '../../types/telemetry';

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  activeCount: number;
}

export function Header({
  onToggleSidebar,
  onToggleMobileSidebar,
  searchTerm,
  onSearchChange,
  themeMode,
  onToggleTheme,
  activeCount,
}: HeaderProps) {
  const handleToggleMenu = () => {
    if (window.innerWidth <= 900) {
      onToggleMobileSidebar();
    } else {
      onToggleSidebar();
    }
  };

  return (
    <header className="darkone-header">
      <div className="header-left">
        {/* Single Unified Menu Button */}
        <button
          type="button"
          className="toggle-sidebar-btn"
          onClick={handleToggleMenu}
          title="Alternar Menú"
        >
          <Menu size={18} />
        </button>

        {/* Global Search Input */}
        <div className="header-search">
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar embarcación o ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="header-right">
        {/* System Active Status Pill */}
        <div className="status-pill">
          <div className="pulse-dot" />
          <Radio size={14} />
          <span>{activeCount} Embarcaciones Transmitiendo</span>
        </div>

        {/* Theme Switcher Toggle Button */}
        <button
          type="button"
          className="header-action-btn"
          onClick={onToggleTheme}
          title={themeMode === 'light' ? 'Cambiar a Tema Oscuro' : 'Cambiar a Tema Claro'}
        >
          {themeMode === 'light' ? (
            <>
              <Moon size={16} style={{ color: '#2563eb' }} />
              <span>Tema Oscuro</span>
            </>
          ) : (
            <>
              <Sun size={16} style={{ color: '#fbbf24' }} />
              <span>Tema Claro</span>
            </>
          )}
        </button>

        {/* User Profile Chip */}
        <div className="user-profile-chip">
          <div className="user-avatar">RT</div>
          <div className="user-meta">
            <span className="user-name">Comando Rivertech</span>
            <span className="user-role">Operador Central</span>
          </div>
        </div>
      </div>
    </header>
  );
}
