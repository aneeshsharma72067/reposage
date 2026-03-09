import Image from 'next/image';
import Link from 'next/link';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { Activity, ArrowUpRight, Gauge, Play, Shield, UserRound } from 'lucide-react';
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

const threatFeed = [
  { label: 'Live Threat Leg', age: '23m ago' },
  { label: 'Live Threat Log', age: '12m ago' },
  { label: 'Live Threat Leg', age: '1m ago' },
  { label: 'Live Threat Leg', age: '1m ago' },
];

const processToggles = [
  { label: 'AI Process', active: true },
  { label: 'AI Processments', active: false },
  { label: 'AI Processes', active: true },
];

const partnerNames = ['Vercel', 'loom', 'Cash App', 'Loops', 'zapier', 'ramp', 'Raycast'];

const telemetryItems = [
  {
    side: 'left' as const,
    vertical: 'top' as const,
    icon: Activity,
    title: 'AGENT AWARENESS',
    subtitle: 'ACTIVE | 99.8% Confidence',
  },
  {
    side: 'right' as const,
    vertical: 'top' as const,
    icon: Shield,
    title: 'SWARM MONITOR',
    subtitle: '15K TPS | STABLE',
  },
  {
    side: 'left' as const,
    vertical: 'bottom' as const,
    icon: Shield,
    title: 'CONTRACT SHIELD',
    subtitle: 'SECURED | 0 VULNS',
  },
  {
    side: 'right' as const,
    vertical: 'bottom' as const,
    icon: Activity,
    title: 'NODE HEALTH',
    subtitle: '12,500 NODES | ONLINE',
  },
];

export default function HomePage() {
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
      <div
        className="pointer-events-none absolute inset-[2%_1%] rounded-[30px] blur-[38px]"
        style={{
          background:
            'radial-gradient(circle at 15% 25%, rgba(255, 255, 255, 0.16), transparent 32%), radial-gradient(circle at 80% 10%, rgba(255, 255, 255, 0.1), transparent 30%)',
        }}
      />

      <section className="relative z-[1] min-h-[calc(100vh-clamp(28px,6vw,56px))] overflow-hidden rounded-[28px] border border-white/10 bg-[#050505] shadow-[0_30px_80px_rgba(0,0,0,0.66),inset_0_1px_0_rgba(255,255,255,0.08)] max-[899px]:min-h-0 max-[899px]:pb-1">
        <Image
          src={bgImage}
          alt="Futuristic network background"
          fill
          priority
          className="scale-[1.04] object-cover object-center brightness-[0.34] grayscale contrast-[1.12]"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.07), transparent 38%), linear-gradient(180deg, rgba(0, 0, 0, 0.58) 0%, rgba(0, 0, 0, 0.76) 58%, rgba(0, 0, 0, 0.88) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage: noiseBackground,
          }}
        />

        <header className="relative z-20 flex items-center justify-between gap-4 px-4 py-4 min-[900px]:px-[1.6rem] max-[520px]:px-[0.9rem]">
          <Link
            href="/"
            className="relative inline-flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5 backdrop-blur-[10px]"
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
            className="hidden items-center gap-1 justify-center rounded-full border border-white/10 bg-[rgba(7,7,7,0.76)] p-[0.28rem] backdrop-blur-[12px] min-[900px]:inline-flex"
            aria-label="Primary"
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full px-3 py-[0.42rem] text-[0.74rem] text-white/75 transition-colors duration-200 hover:bg-white/10 hover:text-white/95"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-[0.7rem] py-[0.42rem] text-[0.72rem] text-white/90"
            >
              Protection <ArrowUpRight size={13} />
            </button>
          </nav>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[rgba(7,7,7,0.62)] px-3 py-2 text-[0.82rem] text-white/90 backdrop-blur-[10px] max-[899px]:px-[0.66rem] max-[899px]:py-[0.48rem] max-[899px]:text-xs"
          >
            <UserRound size={15} />
            Create Account
          </Link>
        </header>

        {telemetryItems.map((item) => {
          const Icon = item.icon;
          const horizontal =
            item.side === 'left'
              ? 'left-[clamp(14px,5vw,54px)]'
              : 'right-[clamp(14px,5vw,54px)] text-right';
          const vertical =
            item.vertical === 'top'
              ? 'top-[clamp(96px,16vh,145px)]'
              : 'top-[clamp(332px,54vh,420px)]';

          return (
            <div
              key={`${item.side}-${item.vertical}-${item.title}`}
              className={`absolute z-20 hidden items-center gap-2.5 text-[0.7rem] tracking-[0.02em] text-white/85 min-[900px]:inline-flex ${horizontal} ${vertical}`}
            >
              <div className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border border-white/30 bg-white/10">
                <Icon size={12} />
              </div>
              <div>
                <p className="m-0 text-[0.83rem] font-semibold">{item.title}</p>
                <span className="text-white/70">{item.subtitle}</span>
              </div>
            </div>
          );
        })}

        <div className="relative z-20 mx-auto mt-[clamp(2rem,9vh,6rem)] max-w-[820px] px-4 text-center">
          <button
            className="mb-[1.4rem] inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-[8px]"
            type="button"
            aria-label="Play intro video"
          >
            <Play size={16} fill="white" />
          </button>

          <h1
            className={`${headingFont.className} m-0 text-[clamp(1.72rem,11vw,2.2rem)] font-bold leading-[1.04] tracking-[0.03em] text-white/95 min-[521px]:text-[clamp(2rem,5vw,4.1rem)]`}
          >
            CONTINUOUS AWARENESS
            <br />
            FOR EVOLVING SYSTEM
          </h1>

          <p className="mt-4 text-[clamp(0.88rem,1.55vw,1.18rem)] leading-[1.5] text-white/75">
            Our advanced AI models actively monitor, detect, and respond to threats
            <br className="max-[899px]:hidden" />
            across decentralized protocols in real-time.
          </p>

          <div className="mt-[1.65rem] inline-flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-[1.2rem] py-[0.74rem] text-[0.9rem] font-bold text-white/90 transition-transform duration-200 hover:-translate-y-px"
            >
              View Platform <ArrowUpRight size={15} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-[#f5f5f5] px-[1.2rem] py-[0.74rem] text-[0.9rem] font-bold text-[#070707] transition-transform duration-200 hover:-translate-y-px"
            >
              Request Access
            </Link>
          </div>
        </div>

        <div className="relative z-20 mx-auto mt-[clamp(2rem,8.5vh,4.2rem)] grid w-[calc(100%-1rem)] max-w-[860px] grid-cols-1 gap-[0.85rem] min-[900px]:w-[min(92%,860px)] min-[900px]:grid-cols-3 min-[900px]:gap-[0.7rem]">
          <article className="rounded-[14px] border border-white/20 bg-[rgba(244,244,244,0.94)] px-[0.8rem] py-[0.76rem] text-[#0f0f0f] backdrop-blur-[16px]">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="m-0 text-[0.86rem]">Live Threat Feed</h2>
              <span className="text-base leading-none opacity-60">...</span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-[0.35rem] p-0">
              {threatFeed.map((entry, index) => (
                <li
                  key={`${entry.label}-${index}`}
                  className="flex items-center justify-between py-[0.18rem] text-[0.72rem] text-black/75"
                >
                  <span>{entry.label}</span>
                  <span>{entry.age}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[14px] border border-white/20 bg-[rgba(244,244,244,0.94)] px-[0.8rem] py-[0.76rem] text-[#0f0f0f] backdrop-blur-[16px]">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="m-0 text-[0.86rem]">Active Agent Panel</h2>
              <span className="text-base leading-none opacity-60">...</span>
            </div>
            <div className="mb-[0.45rem] flex flex-wrap gap-[0.3rem]">
              {['Status', 'AI', 'Grid', 'Live'].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-black/20 px-[0.44rem] py-[0.16rem] text-[0.62rem]"
                >
                  {chip}
                </span>
              ))}
            </div>
            <ul className="m-0 flex list-none flex-col gap-[0.35rem] p-0">
              {processToggles.map((process) => (
                <li
                  key={process.label}
                  className="flex items-center justify-between py-[0.18rem] text-[0.72rem] text-black/75"
                >
                  <span>{process.label}</span>
                  <span
                    className={`relative inline-flex h-[17px] w-[31px] items-center rounded-full ${process.active ? 'bg-black/75' : 'bg-black/20'}`}
                    aria-hidden="true"
                  >
                    <span
                      className={`absolute left-[2px] h-[13px] w-[13px] rounded-full bg-white transition-transform duration-200 ${process.active ? 'translate-x-[14px]' : ''}`}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[14px] border border-white/20 bg-[rgba(250,250,250,0.98)] px-[0.8rem] py-[0.76rem] text-[#090909] backdrop-blur-[16px]">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="m-0 text-[0.86rem]">System Health Gauge</h2>
              <span className="text-base leading-none opacity-60">...</span>
            </div>
            <div className="grid place-items-center text-black/90" aria-hidden="true">
              <Gauge size={78} strokeWidth={1.75} />
              <strong className="mt-1 text-[1.55rem] font-bold">1339</strong>
            </div>
          </article>
        </div>

        <div className="relative z-20 mt-[clamp(1.2rem,4.6vh,2.4rem)] flex flex-wrap items-center justify-between gap-[0.9rem] px-[1.2rem] pb-[1.2rem] min-[900px]:flex-nowrap min-[900px]:items-end">
          <span className="inline-flex items-center gap-[0.3rem] rounded-full border border-white/20 bg-white/10 px-[0.66rem] py-[0.42rem] text-[0.74rem] text-white/75">
            02/03 . Scroll down
          </span>
          <div className="grid w-full grid-cols-2 gap-x-[0.9rem] gap-y-2 text-[0.83rem] font-bold text-white/65 min-[521px]:grid-cols-3 min-[521px]:text-[0.9rem] min-[900px]:flex min-[900px]:w-auto min-[900px]:items-center min-[900px]:gap-[1.8rem] min-[900px]:text-[1.15rem]">
            {partnerNames.map((partner, index) => (
              <span
                key={partner}
                className={index === 0 || index === 2 || index === 6 ? '' : 'lowercase'}
              >
                {partner}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
