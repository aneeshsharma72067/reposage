import type { AuthenticatedUser } from '../auth/auth.types';

export interface InstallationCallbackQuery {
  installation_id?: string;
}

export interface LinkInstallationInput {
  installationId: string;
  user: AuthenticatedUser;
}

