import type { JWTPayload } from 'jose';

export interface GenerateAppJwtConfig {
  appId: string;
  privateKeyPath: string;
}

export interface GithubAppJwtPayload extends JWTPayload {
  iat: number;
  exp: number;
  iss: string;
}

export interface GithubInstallationAccessTokenResponse {
  token: string;
}

export interface GithubRepositoryOwner {
  login: string;
  type: string;
}

export interface GithubInstallationRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string | null;
  owner: GithubRepositoryOwner;
}

export interface GithubInstallationRepositoriesResponse {
  total_count: number;
  repositories: GithubInstallationRepository[];
}

