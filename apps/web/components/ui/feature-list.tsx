const features = [
  {
    title: 'Metadata Access',
    description: 'To analyze repository structure and dependency graphs.',
  },
  {
    title: 'Webhook Ingestion',
    description: 'To receive real-time updates on PRs, Pushes, and Merges.',
  },
  {
    title: 'Read-Only Code Access',
    description: 'Agents analyze changes in context. We never write or commit code.',
  },
];

export function FeatureList() {
  return (
    <section className="mt-10">
      <p className="text-xs font-semibold tracking-[0.06em] text-textMuted">WHY GITHUB APP?</p>
      <ul className="mt-7 space-y-6">
        {features.map((feature) => (
          <li key={feature.title} className="glass-panel-soft flex gap-3 rounded-tokenMd px-4 py-3">
            <span className="mt-1 inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[var(--success-dim)] text-[var(--success)]">
              ✓
            </span>
            <div>
              <h3 className="text-[14px] font-semibold text-white">{feature.title}</h3>
              <p className="text-[13px] leading-[1.5] text-textSecondary">{feature.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
