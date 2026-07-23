import type { CSSProperties } from 'react';
import { clamp, formatNumber } from '../../lib/format';

interface HudGaugeProps {
  label: string;
  value: number | null;
  min?: number;
  max: number;
  unit: string;
  tone?: 'cyan' | 'green' | 'magenta';
  compact?: boolean;
}

export function HudGauge({
  label,
  value,
  min = 0,
  max,
  unit,
  tone = 'cyan',
  compact = false,
}: HudGaugeProps) {
  const safeValue = value ?? min;
  const ratio = clamp((safeValue - min) / Math.max(1, max - min), 0, 1);
  const style = {
    '--gauge-progress': `${ratio * 270}deg`,
  } as CSSProperties;

  return (
    <div className={`hud-gauge hud-gauge--${tone} ${compact ? 'hud-gauge--compact' : ''}`}>
      <div className="hud-gauge__ring" style={style}>
        <div className="hud-gauge__core">
          <strong>{formatNumber(value)}</strong>
          <span>{unit}</span>
        </div>
      </div>
      <div className="hud-gauge__label">{label}</div>
      <div className="hud-gauge__scale">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
