export interface GithubWebhookHeaders {
  'x-github-event'?: string | string[];
  'x-github-delivery'?: string | string[];
}

export interface GithubWebhookPayload {
  action?: string;
  [key: string]: unknown;
}

