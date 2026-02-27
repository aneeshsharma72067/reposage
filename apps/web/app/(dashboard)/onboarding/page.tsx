'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FooterBar } from '@/components/layout/footer-bar';
import { TopNav } from '@/components/layout/top-nav';
import { FeatureList } from '@/components/ui/feature-list';
import { InstallPanel } from '@/components/ui/install-panel';
import { clearAccessToken, getAccessToken, listRepositories } from '@/lib/auth';
import type { RepositoryListItem } from '@/types/repository';

export default function OnboardingPage() {
  const router = useRouter();
  const [repositories, setRepositories] = useState<RepositoryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/login');
      return;
    }

    const loadRepositories = async () => {
      setIsLoading(true);

      try {
        const response = await listRepositories();
        setRepositories(response);
        setErrorMessage(null);
      } catch (error) {
        if (error instanceof Error && error.message === 'MISSING_ACCESS_TOKEN') {
          clearAccessToken();
          router.replace('/login');
          return;
        }

        setErrorMessage('Unable to load repositories. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadRepositories();
  }, [router]);

  const hasConnectedRepositories = useMemo(() => repositories.length > 0, [repositories]);

  useEffect(() => {
    if (!isLoading && hasConnectedRepositories) {
      router.replace('/dashboard');
    }
  }, [isLoading, hasConnectedRepositories, router]);

  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <TopNav />

      <section className="mx-auto grid w-full max-w-[1280px] flex-1 grid-cols-1 lg:grid-cols-[38%_62%]">
        <div className="border-r border-surface400 px-16 py-12">
          <h1 className="text-[36px] font-bold leading-[1.2] tracking-[-0.02em]">
            Connect your Engineering Environment
          </h1>
          <p className="mt-5 max-w-[520px] text-[15px] leading-[1.6] text-textSecondary">
            Agentic AI monitors your repository events in real-time to detect architectural drift
            and API contract breaks.
          </p>

          <FeatureList />

          <div className="mt-9 rounded-tokenLg border border-[var(--info-border)] bg-[var(--info-bg)] px-5 py-4 text-[15px] leading-[1.6] text-[var(--info-text)]">
            <p>
              You can granularly select which repositories the Agent has access to during the GitHub
              installation step.
            </p>
          </div>
        </div>

        <div className="px-12 py-12">
          <InstallPanel
            isLoading={isLoading}
            errorMessage={errorMessage}
            hasConnectedRepositories={hasConnectedRepositories}
            repositories={repositories}
          />
        </div>
      </section>

      <FooterBar />
    </main>
  );
}
