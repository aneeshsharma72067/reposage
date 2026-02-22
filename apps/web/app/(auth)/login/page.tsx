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
    <main className="min-h-screen bg-black text-white">
      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[55%_45%]">
        <div className="border-r border-surface400 bg-[#060606] px-16 py-14">
          <div className="mb-16 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-tokenSm border border-white/15 bg-[#1c1c1c] text-sm">
              ⌁
            </div>
            <span className="text-[15px] font-semibold">Agentic.ai</span>
          </div>

          <h1 className="max-w-[560px] text-[36px] font-bold leading-[1.2] tracking-[-0.02em]">
            System-aware engineering intelligence.
          </h1>
          <p className="mt-5 max-w-[560px] text-[15px] leading-[1.5] text-textSecondary">
            Monitor architectural boundaries and API contracts in real-time across your GitHub
            organization.
          </p>

          <div className="mt-10 max-w-[560px] rounded-tokenLg border border-surface400 bg-surface200 p-6 font-mono text-sm leading-[1.7]">
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
              &gt;&gt; Status: <span className="font-semibold text-[#4ade80]">CRITICAL_ISSUE_FOUND</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-10 py-10">
          <AuthForm />
        </div>
      </section>
    </main>
  );
}
