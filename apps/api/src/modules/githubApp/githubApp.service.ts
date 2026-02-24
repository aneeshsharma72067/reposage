import { readFile } from 'node:fs/promises';
import { createPrivateKey } from 'node:crypto';
import { SignJWT, importPKCS8 } from 'jose';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import type {
  GenerateAppJwtConfig,
  GithubAppJwtPayload,
  GithubInstallationAccessTokenResponse,
  GithubInstallationRepositoriesResponse,
} from './githubApp.types';

function getGenerateJwtConfig(): GenerateAppJwtConfig {
  const appId = env.GITHUB_APP_ID?.trim();
  const privateKeyPath = env.GITHUB_APP_PRIVATE_KEY_PATH?.trim();

  if (!appId || !privateKeyPath) {
    throw new AppError(
      'Missing GitHub App JWT configuration',
      500,
      'GITHUB_APP_CONFIG_MISSING',
    );
  }

  return {
    appId,
    privateKeyPath,
  };
}

function normalizePem(pem: string): string {
  const normalizedPem = pem.replace(/\r\n/g, '\n').trim();

  if (!normalizedPem) {
    throw new AppError(
      'GitHub App private key is empty',
      500,
      'GITHUB_APP_PRIVATE_KEY_MISSING',
    );
  }

  return normalizedPem.endsWith('\n') ? normalizedPem : `${normalizedPem}\n`;
}

function toPkcs8Pem(pem: string): string {
  if (pem.includes('BEGIN PRIVATE KEY')) {
    return pem;
  }

  try {
    const keyObject = createPrivateKey({ key: pem, format: 'pem' });
    const exported = keyObject.export({ format: 'pem', type: 'pkcs8' });
    return Buffer.isBuffer(exported) ? exported.toString('utf8') : exported;
  } catch {
    throw new AppError(
      'Invalid GitHub App private key format',
      500,
      'GITHUB_APP_PRIVATE_KEY_INVALID',
    );
  }
}

async function readPrivateKeyFromPath(privateKeyPath: string): Promise<string> {
  try {
    const rawPem = await readFile(privateKeyPath, 'utf8');
    return normalizePem(rawPem);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new AppError(
        'GitHub App private key file not found',
        500,
        'GITHUB_APP_PRIVATE_KEY_NOT_FOUND',
      );
    }

    throw new AppError(
      'Failed to read GitHub App private key file',
      500,
      'GITHUB_APP_PRIVATE_KEY_READ_FAILED',
    );
  }
}

export async function generateAppJwt(): Promise<string> {
  const { appId, privateKeyPath } = getGenerateJwtConfig();
  const pem = await readPrivateKeyFromPath(privateKeyPath);
  const pkcs8Pem = toPkcs8Pem(pem);

  let privateKey;
  try {
    privateKey = await importPKCS8(pkcs8Pem, 'RS256');
  } catch {
    throw new AppError(
      'Invalid GitHub App private key format',
      500,
      'GITHUB_APP_PRIVATE_KEY_INVALID',
    );
  }

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 600;
  const payload: GithubAppJwtPayload = {
    iat,
    exp,
    iss: appId,
  };

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(privateKey);

  console.debug('GitHub App JWT generated');

  return jwt;
}

export async function generateInstallationAccessToken(
  installationId: bigint,
): Promise<string> {
  const appJwt = await generateAppJwt();
  const installationIdString = installationId.toString();

  const response = await fetch(
    `https://api.github.com/app/installations/${installationIdString}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  let responseBody: Partial<GithubInstallationAccessTokenResponse> | undefined;
  try {
    responseBody =
      (await response.json()) as Partial<GithubInstallationAccessTokenResponse>;
  } catch {
    responseBody = undefined;
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new AppError(
        'Invalid GitHub App JWT',
        401,
        'GITHUB_APP_JWT_INVALID',
      );
    }

    if (response.status === 404) {
      throw new AppError(
        'GitHub installation not found for configured GitHub App',
        404,
        'GITHUB_INSTALLATION_NOT_FOUND',
      );
    }

    throw new AppError(
      'Failed to create installation access token',
      502,
      'GITHUB_INSTALLATION_TOKEN_EXCHANGE_FAILED',
    );
  }

  const token = responseBody?.token;
  if (!token) {
    throw new AppError(
      'GitHub installation access token missing in response',
      502,
      'GITHUB_INSTALLATION_TOKEN_MISSING',
    );
  }

  console.debug('GitHub installation access token generated', {
    installationId: installationIdString,
  });

  return token;
}

interface GithubRepositoryInstallationResponse {
  id?: number;
}

export async function resolveRepositoryInstallationId(
  owner: string,
  repositoryName: string,
): Promise<bigint> {
  const appJwt = await generateAppJwt();
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repositoryName}/installation`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  let responseBody: Partial<GithubRepositoryInstallationResponse> | undefined;
  try {
    responseBody =
      (await response.json()) as Partial<GithubRepositoryInstallationResponse>;
  } catch {
    responseBody = undefined;
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new AppError(
        'Invalid GitHub App JWT',
        401,
        'GITHUB_APP_JWT_INVALID',
      );
    }

    if (response.status === 404) {
      throw new AppError(
        'GitHub App is not installed on this repository',
        404,
        'GITHUB_REPOSITORY_INSTALLATION_NOT_FOUND',
      );
    }

    throw new AppError(
      'Failed to resolve repository installation from GitHub',
      502,
      'GITHUB_REPOSITORY_INSTALLATION_RESOLVE_FAILED',
    );
  }

  if (typeof responseBody?.id !== 'number') {
    throw new AppError(
      'GitHub repository installation id missing in response',
      502,
      'GITHUB_REPOSITORY_INSTALLATION_ID_MISSING',
    );
  }

  return BigInt(responseBody.id);
}

export async function syncInstallationRepositories(
  installationId: bigint,
): Promise<void> {
  const installation = await prisma.githubInstallation.findUnique({
    where: {
      installationId,
    },
    select: {
      id: true,
    },
  });

  if (!installation) {
    throw new AppError(
      'Installation not found in database',
      404,
      'INSTALLATION_NOT_FOUND',
    );
  }

  const installationToken =
    await generateInstallationAccessToken(installationId);

  let response: Response;
  try {
    response = await fetch('https://api.github.com/installation/repositories', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${installationToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  } catch {
    throw new AppError(
      'Failed to fetch installation repositories',
      502,
      'GITHUB_INSTALLATION_REPOSITORIES_FETCH_FAILED',
    );
  }

  let responseBody: Partial<GithubInstallationRepositoriesResponse> | undefined;
  try {
    responseBody =
      (await response.json()) as Partial<GithubInstallationRepositoriesResponse>;
  } catch {
    responseBody = undefined;
  }

  if (!response.ok) {
    throw new AppError(
      'Failed to fetch installation repositories',
      502,
      'GITHUB_INSTALLATION_REPOSITORIES_FETCH_FAILED',
    );
  }

  if (!Array.isArray(responseBody?.repositories)) {
    throw new AppError(
      'Invalid repositories response from GitHub',
      502,
      'GITHUB_INSTALLATION_REPOSITORIES_INVALID_RESPONSE',
    );
  }

  const repositories = responseBody.repositories;
  const totalCount =
    typeof responseBody.total_count === 'number'
      ? responseBody.total_count
      : repositories.length;

  await prisma.$transaction(
    repositories.map((repository) => {
      if (
        typeof repository.id !== 'number' ||
        typeof repository.name !== 'string' ||
        typeof repository.full_name !== 'string' ||
        typeof repository.private !== 'boolean' ||
        typeof repository.owner?.login !== 'string' ||
        typeof repository.owner?.type !== 'string'
      ) {
        throw new AppError(
          'Invalid repository payload from GitHub',
          502,
          'GITHUB_INSTALLATION_REPOSITORIES_INVALID_RESPONSE',
        );
      }

      return prisma.repository.upsert({
        where: {
          githubRepoId: BigInt(repository.id),
        },
        update: {
          installationId: installation.id,
          name: repository.name,
          fullName: repository.full_name,
          private: repository.private,
          defaultBranch: repository.default_branch,
          ownerLogin: repository.owner.login,
          ownerType: repository.owner.type,
          isActive: true,
        },
        create: {
          githubRepoId: BigInt(repository.id),
          installationId: installation.id,
          name: repository.name,
          fullName: repository.full_name,
          private: repository.private,
          defaultBranch: repository.default_branch,
          ownerLogin: repository.owner.login,
          ownerType: repository.owner.type,
          isActive: true,
        },
      });
    }),
  );

  console.info({
    event: 'installation.repositories.synced',
    installationId,
    count: totalCount,
  });
}

