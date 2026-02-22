import type { AuthenticatedUser } from '../auth/auth.types';

export interface InstallationCallbackQuery {
  installation_id?: string;
  state?: string;
}

export interface InstallationStatePayload {
  sub: string;
  githubLogin: string;
  githubUserId: string;
  purpose: 'installation';
}

export interface InstallationStartResponse {
  url: string;
}

export interface LinkInstallationInput {
  installationId: string;
  user: AuthenticatedUser;
}

