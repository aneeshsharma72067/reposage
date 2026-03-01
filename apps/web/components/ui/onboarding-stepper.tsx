const steps = [
  { number: '1', label: 'Auth', active: false },
  { number: '2', label: 'Install App', active: true },
  { number: '3', label: 'Sync Repos', active: false },
];

export function OnboardingStepper() {
  return (
    <ol className="hidden items-center gap-2 sm:flex sm:gap-3">
      {steps.map((step, index) => (
        <li key={step.number} className="flex items-center gap-3">
          <div
            className={`glass-panel-soft flex h-7 w-7 items-center justify-center rounded-tokenSm border text-[13px] font-bold ${
              step.active
                ? 'border-white bg-white text-black'
                : 'border-white/30 bg-transparent text-white/40'
            }`}
          >
            {step.number}
          </div>
          <span
            className={
              step.active
                ? 'text-[13px] font-bold text-white lg:text-base'
                : 'text-[13px] text-white/40 lg:text-base'
            }
          >
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <span className="ml-1 h-px w-7 bg-white/25 lg:ml-2 lg:w-12" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
