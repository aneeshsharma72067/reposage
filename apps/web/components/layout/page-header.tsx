interface PageHeaderProps {
  leftContent: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  actionsClassName?: string;
}

export function PageHeader({ leftContent, actions, className, actionsClassName }: PageHeaderProps) {
  return (
    <header
      className={`glass-header flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 sm:py-0 ${className ?? ''}`}
    >
      <div className="min-w-0">{leftContent}</div>
      {actions ? (
        <div
          className={`flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:gap-2 ${actionsClassName ?? ''}`}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}
