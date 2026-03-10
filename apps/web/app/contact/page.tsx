import Image from 'next/image';
import Link from 'next/link';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { ArrowUpRight, Clock3, Mail, MessageSquareMore, ShieldCheck } from 'lucide-react';
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

const supportChannels = [
  {
    title: 'Support Inbox',
    subtitle: 'support@agenticworkflow.dev',
    icon: Mail,
    href: 'mailto:support@agenticworkflow.dev',
  },
  {
    title: 'Typical Response',
    subtitle: 'Within 24 hours on weekdays',
    icon: Clock3,
  },
  {
    title: 'Security Intake',
    subtitle: 'security@agenticworkflow.dev',
    icon: ShieldCheck,
    href: 'mailto:security@agenticworkflow.dev',
  },
];

export default function ContactPage() {
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
      <section className="relative z-[1] overflow-hidden rounded-[28px] border border-white/10 bg-[#050505] shadow-[0_30px_80px_rgba(0,0,0,0.66),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <Image
          src={bgImage}
          alt="Contact background"
          fill
          priority
          className="scale-[1.04] object-cover object-center brightness-[0.34] grayscale contrast-[1.12]"
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
          </nav>

          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[rgba(7,7,7,0.62)] px-3 py-2 text-[0.82rem] text-white/90 backdrop-blur-[10px] max-[899px]:px-[0.66rem] max-[899px]:py-[0.48rem] max-[899px]:text-xs"
          >
            <MessageSquareMore size={15} />
            Back to FAQ
          </Link>
        </header>

        <div className="relative z-20 mx-auto max-w-[1080px] px-4 pb-10 pt-6 min-[900px]:pb-14">
          <div className="mx-auto max-w-[760px] text-center">
            <p className="text-xs font-semibold tracking-[0.16em] text-white/65">CONTACT</p>
            <h1
              className={`${headingFont.className} mt-4 text-[clamp(1.9rem,7vw,3.4rem)] font-bold leading-[1.03] tracking-[0.03em] text-white/95`}
            >
              Reach The Agentic Team
            </h1>
            <p className="mx-auto mt-5 max-w-[720px] text-[clamp(0.95rem,1.6vw,1.1rem)] leading-[1.6] text-white/75">
              Share your goals, questions, or launch plans and we will route your request to the
              right product, solutions, or engineering contact.
            </p>
          </div>

          <div className="mt-8 grid gap-4 min-[980px]:grid-cols-[1fr_1.25fr]">
            <aside className="space-y-3">
              {supportChannels.map((channel) => {
                const Icon = channel.icon;

                if (channel.href) {
                  return (
                    <Link
                      key={channel.title}
                      href={channel.href}
                      className="block rounded-2xl border border-white/15 bg-[rgba(255,255,255,0.06)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[14px] transition-colors duration-200 hover:bg-[rgba(255,255,255,0.12)]"
                    >
                      <div className="flex items-center gap-2 text-white/90">
                        <Icon size={16} />
                        <h2 className="text-sm font-semibold tracking-[0.04em]">{channel.title}</h2>
                      </div>
                      <p className="mt-2 text-sm text-white/72">{channel.subtitle}</p>
                    </Link>
                  );
                }

                return (
                  <article
                    key={channel.title}
                    className="rounded-2xl border border-white/15 bg-[rgba(255,255,255,0.06)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[14px]"
                  >
                    <div className="flex items-center gap-2 text-white/90">
                      <Icon size={16} />
                      <h2 className="text-sm font-semibold tracking-[0.04em]">{channel.title}</h2>
                    </div>
                    <p className="mt-2 text-sm text-white/72">{channel.subtitle}</p>
                  </article>
                );
              })}
            </aside>

            <section className="rounded-2xl border border-white/15 bg-[rgba(255,255,255,0.06)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[14px] min-[900px]:p-6">
              <h2
                id="contact-form-title"
                className="text-lg font-semibold tracking-[0.03em] text-white/92"
              >
                Send Us A Message
              </h2>
              <p
                id="contact-form-description"
                className="mt-2 text-sm leading-relaxed text-white/72"
              >
                Required fields are marked with an asterisk. We only use this information to respond
                to your request.
              </p>

              <form className="mt-5 space-y-3" aria-labelledby="contact-form-title" noValidate>
                <div className="grid gap-3 min-[760px]:grid-cols-2">
                  <div>
                    <label
                      htmlFor="full-name"
                      className="mb-1.5 block text-xs font-medium text-white/82"
                    >
                      Full Name *
                    </label>
                    <input
                      id="full-name"
                      name="fullName"
                      type="text"
                      required
                      autoComplete="name"
                      className="w-full rounded-xl border border-white/14 bg-black/35 px-3 py-2.5 text-sm text-white/92 placeholder:text-white/45 focus:border-white/35 focus:outline-none"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="work-email"
                      className="mb-1.5 block text-xs font-medium text-white/82"
                    >
                      Work Email *
                    </label>
                    <input
                      id="work-email"
                      name="workEmail"
                      type="email"
                      required
                      autoComplete="email"
                      className="w-full rounded-xl border border-white/14 bg-black/35 px-3 py-2.5 text-sm text-white/92 placeholder:text-white/45 focus:border-white/35 focus:outline-none"
                      placeholder="jane@company.com"
                    />
                  </div>
                </div>

                <div className="grid gap-3 min-[760px]:grid-cols-2">
                  <div>
                    <label
                      htmlFor="company"
                      className="mb-1.5 block text-xs font-medium text-white/82"
                    >
                      Company
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      autoComplete="organization"
                      className="w-full rounded-xl border border-white/14 bg-black/35 px-3 py-2.5 text-sm text-white/92 placeholder:text-white/45 focus:border-white/35 focus:outline-none"
                      placeholder="Acme Labs"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="topic"
                      className="mb-1.5 block text-xs font-medium text-white/82"
                    >
                      Topic *
                    </label>
                    <select
                      id="topic"
                      name="topic"
                      required
                      defaultValue=""
                      className="w-full rounded-xl border border-white/14 bg-black/35 px-3 py-2.5 text-sm text-white/92 focus:border-white/35 focus:outline-none"
                    >
                      <option value="" disabled>
                        Select a topic
                      </option>
                      <option value="product">Product walkthrough</option>
                      <option value="access">Platform access</option>
                      <option value="integration">Integration support</option>
                      <option value="security">Security and compliance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-1.5 block text-xs font-medium text-white/82"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    minLength={20}
                    rows={6}
                    className="w-full resize-y rounded-xl border border-white/14 bg-black/35 px-3 py-2.5 text-sm text-white/92 placeholder:text-white/45 focus:border-white/35 focus:outline-none"
                    placeholder="Tell us what you are building and how we can help."
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-white/62">
                    By submitting, you agree to be contacted about your request.
                  </p>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-0"
                  >
                    Send Message
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
