import React from 'react';
import { 
  BarChart3, 
  Map, 
  Table2, 
  Activity, 
  Fuel, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import type { DashboardId } from '../../types/telemetry';

interface SidebarProps {
  currentDashboard: DashboardId;
  onSelectDashboard: (id: DashboardId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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

  return (
    <aside className={`darkone-sidebar ${isCollapsed ? 'is-collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <ShieldCheck size={24} />
        </div>
        {!isCollapsed && (
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">RIVERTECH</span>
            <span className="sidebar-brand-subtitle">Comando Fluvial</span>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <div key={group.title} className="sidebar-group">
            {!isCollapsed && <div className="sidebar-group-title">{group.title}</div>}
            <ul className="sidebar-menu">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentDashboard === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`sidebar-item-btn ${isActive ? 'is-active' : ''}`}
                      onClick={() => onSelectDashboard(item.id)}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span className="item-icon">
                        <Icon size={19} />
                      </span>
                      {!isCollapsed && <span>{item.label}</span>}
                      {!isCollapsed && item.badge && (
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
          style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
        >
          <span className="item-icon">
            {isCollapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
          </span>
          {!isCollapsed && <span>Plegar Menú</span>}
        </button>
      </div>
    </aside>
  );
}
