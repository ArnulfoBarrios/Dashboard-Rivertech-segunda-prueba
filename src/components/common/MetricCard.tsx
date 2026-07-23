import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  tone?: 'cyan' | 'green' | 'magenta' | 'muted';
}

export function MetricCard({
  label,
  value,
  helper,
  icon,
  tone = 'cyan',
}: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__top">
        <span>{label}</span>
        {icon}
      </div>
      <strong className="metric-card__value">{value}</strong>
      {helper && <small className="metric-card__helper">{helper}</small>}
    </article>
  );
}
