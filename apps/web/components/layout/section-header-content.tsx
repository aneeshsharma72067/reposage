interface SectionHeaderContentProps {
  title: string;
  subtitle?: string;
}

export function SectionHeaderContent({ title, subtitle }: SectionHeaderContentProps) {
  return (
    <div className="space-y-0.5">
      <h1 className="text-[18px] font-semibold tracking-tight text-white/90">{title}</h1>
      {subtitle ? <p className="hidden text-[12px] text-white/45 md:block">{subtitle}</p> : null}
    </div>
  );
}
