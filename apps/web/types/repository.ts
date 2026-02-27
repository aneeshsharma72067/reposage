export interface RepositoryListItem {
  id: string;
  githubRepoId: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  installationId: string;
  isActive: boolean;
  status: string;
}

export interface RepositoryDetails {
  id: string;
  githubRepoId: string;
  name: string;
  fullName: string;
  private: boolean;
  isActive: boolean;
  htmlUrl: string;
  description: string | null;
  homepage: string | null;
  defaultBranch: string;
  language: string | null;
  topics: string[];
  stargazersCount: number;
  watchersCount: number;
  forksCount: number;
  openIssuesCount: number;
  subscribersCount: number;
  size: number;
  archived: boolean;
  disabled: boolean;
  visibility: string;
  licenseName: string | null;
  pushedAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  recentCommits: RepositoryCommit[];
}

export interface RepositoryCommit {
  sha: string;
  message: string;
  authorName: string | null;
  authoredAt: string | null;
  url: string;
}
