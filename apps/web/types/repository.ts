export interface RepositoryListItem {
  id: string;
  githubRepoId: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  installationId: string;
  isActive: boolean;
}
