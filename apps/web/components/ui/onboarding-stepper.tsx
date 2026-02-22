const steps = [
  { number: '1', label: 'Auth', active: false },
  { number: '2', label: 'Install App', active: true },
  { number: '3', label: 'Sync Repos', active: false },
];

export function OnboardingStepper() {
  return (
    <ol className="hidden items-center gap-3 md:flex">
      {steps.map((step, index) => (
        <li key={step.number} className="flex items-center gap-3">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-tokenSm border text-[13px] font-bold ${
              step.active
                ? 'border-white bg-white text-black'
                : 'border-white/30 bg-transparent text-white/40'
            }`}
          >
            {step.number}
          </div>
          <span className={step.active ? 'text-base font-bold text-white' : 'text-base text-white/40'}>
            {step.label}
          </span>
          {index < steps.length - 1 ? <span className="ml-2 h-px w-12 bg-white/20" /> : null}
        </li>
      ))}
    </ol>
  );
}
