export interface GithubAccessTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GithubUserProfile {
  id: number;
  login: string;
  avatar_url: string | null;
}

export interface UserRecord {
  id: string;
  github_user_id: string;
  github_login: string;
  avatar_url: string | null;
}

export interface AuthJwtPayload {
  sub: string;
  githubUserId: string;
  login: string;
}

export interface AuthenticatedUser {
  id: string;
  githubUserId: string;
  githubLogin: string;
  avatarUrl: string | null;
}

export interface GithubCallbackQuery {
  code?: string;
}

