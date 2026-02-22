'use client';

import { useMemo, useState, useTransition } from 'react';

export function AuthForm() {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apiBaseUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  }, []);

  const onGithubAuth = () => {
    if (!apiBaseUrl) {
      setErrorMessage('Missing NEXT_PUBLIC_API_URL configuration.');
      return;
    }

    startTransition(() => {
      window.location.href = `${apiBaseUrl}/auth/github`;
    });
  };

  const onEmailPasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('Email/password login is not enabled in the current backend.');
  };

  return (
    <div className="w-full max-w-[420px]">
      <h2 className="text-[18px] font-semibold">Sign in to Agentic</h2>
      <p className="mt-2 text-[15px] text-textSecondary">Enter your credentials to access your dashboard</p>

      <button
        type="button"
        onClick={onGithubAuth}
        disabled={isPending}
        className="mt-8 flex h-[52px] w-full items-center justify-center rounded-full bg-white px-8 text-[14px] font-semibold text-black disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? 'Redirecting...' : 'Continue with GitHub'}
      </button>

      <div className="my-8 flex items-center gap-4 text-xs uppercase tracking-[0.05em] text-textMuted">
        <div className="h-px flex-1 bg-surface400" />
        <span>OR</span>
        <div className="h-px flex-1 bg-surface400" />
      </div>

      <form onSubmit={onEmailPasswordSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-textPrimary">
            Work Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@company.com"
            className="h-12 w-full rounded-tokenMd border border-surface400 bg-surface200 px-4 text-[14px] text-white placeholder:text-textMuted focus:border-white/20 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-textPrimary">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="h-12 w-full rounded-tokenMd border border-surface400 bg-surface200 px-4 text-[14px] text-white placeholder:text-textMuted focus:border-white/20 focus:outline-none"
          />
          <div className="mt-2 text-right font-mono text-xs text-textMuted">Forgot password?</div>
        </div>

        <button
          type="submit"
          className="mt-1 h-[52px] w-full rounded-full bg-white px-8 text-[14px] font-semibold text-black"
        >
          Sign In
        </button>
      </form>

      <div className="mt-6 rounded-tokenMd border border-surface400 bg-surface300 px-4 py-3 font-mono text-sm text-textSecondary">
        Press <span className="rounded-tokenSm border border-white/15 bg-surface400 px-2 py-[2px] text-white">Enter</span>{' '}
        to quickly submit
      </div>

      {errorMessage ? <p className="mt-4 text-sm text-red-300">{errorMessage}</p> : null}

      <p className="mt-8 text-center font-mono text-sm text-textMuted">
        New to Agentic? <span className="font-bold text-white">Create an account</span>
      </p>
    </div>
  );
}
