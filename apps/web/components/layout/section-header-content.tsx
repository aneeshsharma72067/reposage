interface SectionHeaderContentProps {
  sectionLabel: string;
  title: string;
  subtitle: string;
}

export function SectionHeaderContent({ sectionLabel, title, subtitle }: SectionHeaderContentProps) {
  return (
    <div>
      <div className="hidden text-[12px] text-white/30 md:block">
        <span>Organization</span>
        <span className="mx-2 text-white/15">›</span>
        <span className="font-medium text-white/70">{sectionLabel}</span>
      </div>
      <h1 className="mt-0.5 text-[18px] font-semibold tracking-tight text-white/90">{title}</h1>
      <p className="text-[12px] text-white/45">{subtitle}</p>
    </div>
  );
}
