import Link from 'next/link';
import Image from 'next/image';
import { Manrope, Space_Grotesk } from 'next/font/google';
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Database,
  GitBranchPlus,
  Layers3,
  Shield,
  Webhook,
} from 'lucide-react';
import bgImage from '@/assets/bg.png';
import logoImage from '@/assets/logo.png';

const headingFont = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'] });
const bodyFont = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Platform', href: '/platform' },
  { label: 'Features', href: '/features' },
  { label: 'FAQ', href: '/faq' },
];

const workflowSteps = [
  {
    title: 'Capture',
    description: 'Webhook events and commit metadata are ingested in near real-time.',
    icon: Webhook,
  },
  {
    title: 'Contextualize',
    description: 'Diffs are normalized and linked to repository state and historical behavior.',
    icon: Layers3,
  },
  {
    title: 'Analyze',
    description: 'The AI engine scores risk, impact, and confidence with multi-stage prompts.',
    icon: BrainCircuit,
  },
  {
    title: 'Surface',
    description: 'Findings, trends, and health metrics are pushed to dashboards instantly.',
    icon: Shield,
  },
];

const engineStages = [
  {
    title: 'Signal Preparation',
    detail: 'Diff compression, metadata enrichment, and repository baseline lookup.',
  },
  {
    title: 'AI Risk Scoring',
    detail: 'Commit-level reasoning with context windows tuned for repository size and churn.',
  },
  {
    title: 'Finding Synthesis',
    detail: 'Groups related concerns, deduplicates noise, and outputs clear remediation signals.',
  },
  {
    title: 'Trend Aggregation',
    detail: 'Builds health trajectories for repos, teams, and the full organization.',
  },
];

export default function PlatformPage() {
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
          alt="Platform architecture background"
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
                  item.label === 'Platform'
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
              Live <ArrowUpRight size={13} />
            </button>
          </nav>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(7,7,7,0.62)] px-3 py-2 text-[0.82rem] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[10px] max-[899px]:px-[0.66rem] max-[899px]:py-[0.48rem] max-[899px]:text-xs"
          >
            <GitBranchPlus size={15} />
            Open Dashboard
          </Link>
        </header>

        <div className="relative z-20 mx-auto max-w-[1120px] px-4 pb-12 pt-5 min-[900px]:pb-16">
          <div className="mx-auto max-w-[860px] text-center">
            <p className="text-xs font-semibold tracking-[0.16em] text-white/65">
              PLATFORM OVERVIEW
            </p>
            <h1
              className={`${headingFont.className} mt-4 text-[clamp(1.9rem,7vw,3.5rem)] font-bold leading-[1.03] tracking-[0.03em] text-white/95`}
            >
              How The System Works,
              <br />
              From Event To Insight
            </h1>
            <p className="mx-auto mt-5 max-w-[760px] text-[clamp(0.95rem,1.6vw,1.12rem)] leading-[1.6] text-white/75">
              Agentic Workflow is built as an event-driven analysis pipeline that converts raw code
              activity into high-confidence findings and repository health telemetry.
            </p>
          </div>

          <section className="mt-9 rounded-2xl bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[12px] min-[900px]:p-6">
            <h2 className={`${headingFont.className} text-2xl font-semibold text-white/95`}>
              Architecture Flow Diagram
            </h2>
            <p className="mt-2 text-sm leading-[1.6] text-white/72">
              End-to-end pipeline from source events to decision-ready outputs.
            </p>

            <div className="relative mt-6 grid grid-cols-1 gap-4 min-[960px]:grid-cols-4">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === workflowSteps.length - 1;

                return (
                  <article
                    key={step.title}
                    className="relative rounded-xl bg-black/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    {!isLast ? (
                      <div className="pointer-events-none absolute right-[-18px] top-1/2 hidden -translate-y-1/2 min-[960px]:block">
                        <ArrowRight size={16} className="text-white/40" />
                      </div>
                    ) : null}
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                      <Icon size={16} />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-white/95">{step.title}</h3>
                    <p className="mt-2 text-xs leading-[1.6] text-white/70">{step.description}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-5 grid grid-cols-1 gap-5 min-[980px]:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-2xl bg-[rgba(255,255,255,0.05)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[12px] min-[900px]:p-6">
              <h2 className={`${headingFont.className} text-2xl font-semibold text-white/95`}>
                Analysis Engine Layers
              </h2>
              <p className="mt-2 text-sm leading-[1.6] text-white/72">
                The engine balances precision and speed with staged processing and synthesis.
              </p>

              <ol className="mt-5 space-y-3">
                {engineStages.map((stage, index) => (
                  <li
                    key={stage.title}
                    className="rounded-xl bg-black/25 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <p className="text-xs font-semibold tracking-[0.08em] text-white/60">
                      STAGE {index + 1}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-white/95">{stage.title}</h3>
                    <p className="mt-1.5 text-xs leading-[1.6] text-white/70">{stage.detail}</p>
                  </li>
                ))}
              </ol>
            </article>

            <article className="rounded-2xl bg-[rgba(255,255,255,0.05)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[12px] min-[900px]:p-6">
              <h2 className={`${headingFont.className} text-2xl font-semibold text-white/95`}>
                Data Plane Diagram
              </h2>
              <div className="mt-5 space-y-3 text-sm text-white/85">
                <div className="rounded-lg bg-black/25 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <span className="inline-flex items-center gap-2">
                    <Webhook size={14} /> Webhooks and SCM Events
                  </span>
                </div>
                <div className="px-2 text-center text-white/45">|</div>
                <div className="rounded-lg bg-black/25 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <span className="inline-flex items-center gap-2">
                    <Database size={14} /> Event Queue and Diff Store
                  </span>
                </div>
                <div className="px-2 text-center text-white/45">|</div>
                <div className="rounded-lg bg-black/25 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <span className="inline-flex items-center gap-2">
                    <BrainCircuit size={14} /> AI Analyzer Worker
                  </span>
                </div>
                <div className="px-2 text-center text-white/45">|</div>
                <div className="rounded-lg bg-black/25 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <span className="inline-flex items-center gap-2">
                    <Shield size={14} /> Findings, Alerts, and Health APIs
                  </span>
                </div>
              </div>

              <Link
                href="/features"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
              >
                See Product Capabilities <ArrowUpRight size={14} />
              </Link>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
