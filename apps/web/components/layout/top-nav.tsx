import { OnboardingStepper } from '@/components/ui/onboarding-stepper';

export function TopNav() {
  return (
    <header className="glass-header h-14 px-4 sm:px-6">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="glass-panel-soft flex h-9 w-9 items-center justify-center rounded-tokenMd text-sm">
            ⚙
          </div>
          <span className="truncate font-mono text-sm font-bold tracking-[0.06em] sm:text-base lg:text-lg">
            AGENTIC // WORKFLOW
          </span>
        </div>
        <OnboardingStepper />
      </div>
    </header>
  );
}
