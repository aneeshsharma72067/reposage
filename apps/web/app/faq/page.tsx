import Link from 'next/link';
import Image from 'next/image';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { ArrowUpRight, CircleHelp, MessageSquareHeart } from 'lucide-react';
import bgImage from '@/assets/bg.png';
import logoImage from '@/assets/logo.png';
import { FaqAccordion } from '@/components/ui/faq-accordion';

const headingFont = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'] });
const bodyFont = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Platform', href: '/platform' },
  { label: 'Features', href: '/features' },
  { label: 'FAQ', href: '/faq' },
];

export default function FaqPage() {
  const noiseBackground =
    'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.44) 0 2px, transparent 3px), radial-gradient(circle at 75% 22%, rgba(255, 255, 255, 0.35) 0 2px, transparent 3px), radial-gradient(circle at 58% 76%, rgba(255, 255, 255, 0.3) 0 2px, transparent 3px), radial-gradient(circle at 36% 60%, rgba(255, 255, 255, 0.22) 0 2px, transparent 3px)';

  return (
    <main
      className={`relative min-h-screen overflow-hidden p-[clamp(10px,3vw,28px)] ${bodyFont.className}`}
      style={{
        background:
          'radial-gradient(circle at 8% 8%, rgba(255, 255, 255, 0.08), transparent 26%), radial-gradient(circle at 85% 80%, rgba(255, 255, 255, 0.06), transparent 26%), linear-gradient(130deg, #111 0%, #2f2f2f 50%, #171717 100%)',
      }}
    >
      <section className="relative z-[1] overflow-hidden rounded-[28px] bg-[#050505] shadow-[0_30px_80px_rgba(0,0,0,0.66),inset_0_1px_0_rgba(255,255,255,0.05)]">
        <Image
          src={bgImage}
          alt="FAQ background"
          fill
          priority
          className="scale-[1.04] object-cover object-center brightness-[0.32] grayscale contrast-[1.12]"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.07), transparent 38%), linear-gradient(180deg, rgba(0, 0, 0, 0.58) 0%, rgba(0, 0, 0, 0.76) 58%, rgba(0, 0, 0, 0.9) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: noiseBackground }}
        />

        <header className="relative z-20 flex items-center justify-between gap-4 px-4 py-4 min-[900px]:px-[1.6rem] max-[520px]:px-[0.9rem]">
          <Link
            href="/"
            className="relative inline-flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[10px]"
            aria-label="Agentic Workflow home"
          >
            <Image
              src={logoImage}
              alt="Agentic Workflow"
              fill
              className="h-[28px] w-[28px] object-contain brightness-110 saturate-90"
            />
          </Link>

          <nav
            className="hidden items-center gap-1 justify-center rounded-full bg-[rgba(7,7,7,0.76)] p-[0.28rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[12px] min-[900px]:inline-flex"
            aria-label="Primary"
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-full px-3 py-[0.42rem] text-[0.74rem] transition-colors duration-200 ${
                  item.label === 'FAQ'
                    ? 'bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                    : 'text-white/75 hover:bg-white/10 hover:text-white/95'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-[0.7rem] py-[0.42rem] text-[0.72rem] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              Support <ArrowUpRight size={13} />
            </button>
          </nav>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(7,7,7,0.62)] px-3 py-2 text-[0.82rem] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[10px] max-[899px]:px-[0.66rem] max-[899px]:py-[0.48rem] max-[899px]:text-xs"
          >
            <MessageSquareHeart size={15} />
            Contact Team
          </Link>
        </header>

        <div className="relative z-20 mx-auto max-w-[980px] px-4 pb-12 pt-5 min-[900px]:pb-16">
          <div className="mx-auto max-w-[780px] text-center">
            <p className="text-xs font-semibold tracking-[0.16em] text-white/65">HELP CENTER</p>
            <h1
              className={`${headingFont.className} mt-4 text-[clamp(1.9rem,7vw,3.5rem)] font-bold leading-[1.03] tracking-[0.03em] text-white/95`}
            >
              Frequently Asked Questions
            </h1>
            <p className="mx-auto mt-5 max-w-[740px] text-[clamp(0.95rem,1.6vw,1.12rem)] leading-[1.6] text-white/75">
              Quick answers for onboarding, data access, and how our analysis engine behaves in
              production workflows.
            </p>
          </div>

          <section className="mt-9 rounded-2xl bg-[rgba(255,255,255,0.05)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[12px] min-[900px]:p-6">
            <div className="mb-4 flex items-center gap-2 text-white/85">
              <CircleHelp size={16} />
              <span className="text-sm font-medium tracking-[0.06em]">COMMON QUESTIONS</span>
            </div>
            <FaqAccordion />
          </section>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/platform"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
            >
              Explore Platform <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
            >
              View Features <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
