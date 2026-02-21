export interface GithubWebhookHeaders {
  'x-github-event'?: string | string[];
  'x-github-delivery'?: string | string[];
}

export interface GithubInstallationAccountPayload {
  login?: string;
  type?: string;
}

export interface GithubInstallationPayload {
  id?: number;
  account?: GithubInstallationAccountPayload;
}

export interface GithubWebhookPayload {
  action?: string;
  installation?: GithubInstallationPayload;
  [key: string]: unknown;
}

