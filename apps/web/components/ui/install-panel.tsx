'use client';

import { useState } from 'react';
import { getInstallationUrl } from '@/lib/auth';
import type { RepositoryListItem } from '@/types/repository';

interface InstallPanelProps {
  isLoading: boolean;
  errorMessage: string | null;
  hasConnectedRepositories: boolean;
  repositories: RepositoryListItem[];
}

export function InstallPanel({
  isLoading,
  errorMessage,
  hasConnectedRepositories,
  repositories,
}: InstallPanelProps) {
  const [isStartingInstall, setIsStartingInstall] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  const onStartInstall = async () => {
    setIsStartingInstall(true);
    setInstallError(null);

    try {
      const installUrl = await getInstallationUrl();
      window.location.href = installUrl;
    } catch {
      setInstallError('Unable to start installation. Please sign in again and retry.');
      setIsStartingInstall(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-[640px]">
      <div className="mb-8 flex items-center justify-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-token2xl border border-white/10 bg-[#1c1c1e] text-4xl">
          ⌥
        </div>

        <div className="text-center">
          <div className="mb-1 flex justify-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
            <span className="h-2 w-2 rounded-full bg-[rgba(34,197,94,0.35)]" />
            <span className="h-2 w-2 rounded-full bg-[rgba(34,197,94,0.35)]" />
          </div>
          <p className="font-mono text-[10px] font-bold tracking-[0.1em] text-[#22c55e]">ENCRYPTED</p>
        </div>

        <div className="flex h-20 w-20 items-center justify-center rounded-token2xl bg-white text-4xl text-black">
          🤖
        </div>
      </div>

      <div className="token-card px-10 py-10 text-center">
        <h2 className="text-[22px] font-bold">Install Agentic AI GitHub App</h2>
        <p className="mx-auto mt-2 max-w-[520px] text-[14px] leading-[1.6] text-textSecondary">
          Authorize our GitHub App to begin repository synchronization and system analysis.
        </p>

        {hasConnectedRepositories ? (
          <div className="mt-8 text-left">
            <p className="text-base font-semibold text-[var(--success)]">Connected repositories</p>
            <ul className="mt-3 space-y-2">
              {repositories.map((repository) => (
                <li
                  key={repository.id}
                  className="rounded-tokenMd border border-surface400 bg-surface300 px-4 py-3"
                >
                  <p className="text-base font-semibold text-white">{repository.fullName}</p>
                  <p className="text-sm text-textSecondary">
                    {repository.private ? 'Private' : 'Public'} • Default branch: {repository.defaultBranch || 'N/A'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <a
              href="#"
              onClick={(event) => {
                event.preventDefault();
                void onStartInstall();
              }}
              className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-10 text-[15px] font-semibold text-black"
            >
              {isStartingInstall ? 'Starting...' : '↗ Install & Authorize on GitHub'}
            </a>
            <p className="mt-3 text-xs text-textMuted">Secure OAuth2 Connection via GitHub Enterprise</p>
          </>
        )}

        {isLoading ? <p className="mt-4 text-sm text-textSecondary">Loading repositories...</p> : null}
        {errorMessage ? <p className="mt-4 text-sm text-red-300">{errorMessage}</p> : null}
        {installError ? <p className="mt-4 text-sm text-red-300">{installError}</p> : null}
      </div>

      <div className="mt-8 text-center">
        <p className="text-base text-textSecondary">Looking for other integrations?</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="flex h-11 items-center rounded-tokenLg border border-surface400 bg-surface200 px-5 text-base text-textPrimary">
            GitLab
          </span>
          <span className="flex h-11 items-center rounded-tokenLg border border-surface400 bg-surface200 px-5 text-base text-textPrimary">
            Bitbucket
          </span>
        </div>
      </div>
    </div>
  );
}
