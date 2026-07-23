import React from 'react';
import { 
  BarChart3, 
  Map, 
  Table2, 
  Activity, 
  Fuel, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';
import type { DashboardId } from '../../types/telemetry';

interface SidebarProps {
  currentDashboard: DashboardId;
  onSelectDashboard: (id: DashboardId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  totalUnitsCount: number;
}

interface NavItem {
  id: DashboardId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function Sidebar({
  currentDashboard,
  onSelectDashboard,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  totalUnitsCount,
}: SidebarProps) {
  const navGroups: NavGroup[] = [
    {
      title: 'COMANDO PRINCIPAL',
      items: [
        { id: 'overview', label: 'Resumen Ejecutivo', icon: BarChart3, badge: 'KPI' },
        { id: 'map', label: 'Mapa Táctico 2D/3D', icon: Map, badge: 'EN VIVO' },
      ],
    },
    {
      title: 'FLOTA Y ACTIVOS',
      items: [
        { id: 'fleet', label: 'Tabla de Flota y Naves', icon: Table2, badge: `${totalUnitsCount}` },
      ],
    },
    {
      title: 'DIAGNÓSTICO Y ANALÍTICA',
      items: [
        { id: 'health', label: 'Salud del Hardware', icon: Activity },
        { id: 'kinetics', label: 'Combustible y Cinética', icon: Fuel },
      ],
    },
  ];

  const handleSelect = (id: DashboardId) => {
    onSelectDashboard(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-mobile-overlay ${isMobileOpen ? 'is-open' : ''}`}
        onClick={onCloseMobile}
      />

      {/* Sidebar Drawer */}
      <aside
        className={`darkone-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${
          isMobileOpen ? 'is-open-mobile' : ''
        }`}
      >
        {/* Brand Header */}
        <div className="sidebar-brand" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="sidebar-brand-icon">
              <ShieldCheck size={24} />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-title">RIVERTECH</span>
                <span className="sidebar-brand-subtitle">Comando Fluvial</span>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          {isMobileOpen && (
            <button
              type="button"
              className="toggle-sidebar-btn"
              onClick={onCloseMobile}
              style={{ width: '32px', height: '32px' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.title} className="sidebar-group">
              {(!isCollapsed || isMobileOpen) && (
                <div className="sidebar-group-title">{group.title}</div>
              )}
              <ul className="sidebar-menu">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentDashboard === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`sidebar-item-btn ${isActive ? 'is-active' : ''}`}
                        onClick={() => handleSelect(item.id)}
                        title={isCollapsed && !isMobileOpen ? item.label : undefined}
                      >
                        <span className="item-icon">
                          <Icon size={19} />
                        </span>
                        {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
                        {(!isCollapsed || isMobileOpen) && item.badge && (
                          <span className="sidebar-item-badge">{item.badge}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle Footer */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className="sidebar-item-btn"
            onClick={onToggleCollapse}
            style={{ justifyContent: isCollapsed && !isMobileOpen ? 'center' : 'flex-start' }}
          >
            <span className="item-icon">
              {isCollapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
            </span>
            {(!isCollapsed || isMobileOpen) && <span>Plegar Menú</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
