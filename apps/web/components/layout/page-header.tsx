import type { ReactNode } from 'react';

interface PageHeaderProps {
  leftContent: ReactNode;
  actions?: ReactNode;
  className?: string;
  actionsClassName?: string;
}

export function PageHeader({ leftContent, actions, className, actionsClassName }: PageHeaderProps) {
  return (
    <header
      className={`glass-header flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-0 ${className ?? ''}`}
    >
      <div className="min-w-0">{leftContent}</div>
      {actions ? (
        <div
          className={`flex w-full flex-wrap items-center gap-2 sm:w-auto ${actionsClassName ?? ''}`}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}
