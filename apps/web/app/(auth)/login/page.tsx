'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/ui/auth-form';
import { consumeAccessTokenFromHash, getAccessToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    consumeAccessTokenFromHash();

    if (getAccessToken()) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <main className="page-shell min-h-screen text-white">
      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[55%_45%]">
        <div className="glass-panel border-r px-5 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-14">
          <div className="mb-10 flex items-center gap-3 sm:mb-12 lg:mb-16">
            <div className="flex h-9 w-9 items-center justify-center rounded-tokenSm border border-white/15 bg-[#1c1c1c] text-sm">
              ⌁
            </div>
            <span className="text-[15px] font-semibold">Agentic.ai</span>
          </div>

          <h1 className="max-w-[560px] text-[30px] font-bold leading-[1.2] tracking-[-0.02em] sm:text-[34px] lg:text-[36px]">
            System-aware engineering intelligence.
          </h1>
          <p className="mt-5 max-w-[560px] text-[15px] leading-[1.5] text-textSecondary">
            Monitor architectural boundaries and API contracts in real-time across your GitHub
            organization.
          </p>

          <div className="glass-panel-soft mt-8 hidden max-w-[560px] rounded-tokenLg p-6 font-mono text-sm leading-[1.7] md:block lg:mt-10">
            <div className="mb-4 flex gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <p className="text-[#4ade80]">$ agentic analyze --repo core-api</p>
            <p className="mt-1 text-white/55">&gt;&gt; Loading system graph...</p>
            <p className="mt-1 text-[#fb7185]">
              &gt;&gt; Analyzing PR #442: Breaking change detected in /v1/auth
            </p>
            <p className="mt-1 text-[#fb923c]">
              &gt;&gt; Architectural violation: Unintended coupling (Service A → Service C)
            </p>
            <p className="mt-4 text-white/55">
              &gt;&gt; Status:{' '}
              <span className="font-semibold text-[#4ade80]">CRITICAL_ISSUE_FOUND</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
          <AuthForm />
        </div>
      </section>
    </main>
  );
}
