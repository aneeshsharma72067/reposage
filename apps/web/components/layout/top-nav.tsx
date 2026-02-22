import { OnboardingStepper } from '@/components/ui/onboarding-stepper';

export function TopNav() {
  return (
    <header className="h-14 border-b border-surface400 bg-surface100 px-6">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-tokenMd border border-white/10 bg-surface200 text-sm">
            ⚙
          </div>
          <span className="font-mono text-lg font-bold tracking-[0.06em]">AGENTIC // WORKFLOW</span>
        </div>
        <OnboardingStepper />
      </div>
    </header>
  );
}
