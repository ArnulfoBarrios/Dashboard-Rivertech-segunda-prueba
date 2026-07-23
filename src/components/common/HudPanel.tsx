import type { PropsWithChildren, ReactNode } from 'react';

interface HudPanelProps extends PropsWithChildren {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
  accent?: 'cyan' | 'green' | 'magenta';
}

export function HudPanel({
  title,
  eyebrow,
  actions,
  className = '',
  accent = 'cyan',
  children,
}: HudPanelProps) {
  return (
    <section className={`hud-panel hud-panel--${accent} ${className}`}>
      {(title || eyebrow || actions) && (
        <header className="hud-panel__header">
          <div>
            {eyebrow && <span className="hud-panel__eyebrow">{eyebrow}</span>}
            {title && <h2 className="hud-panel__title">{title}</h2>}
          </div>
          {actions && <div className="hud-panel__actions">{actions}</div>}
        </header>
      )}
      <div className="hud-panel__body">{children}</div>
    </section>
  );
}
