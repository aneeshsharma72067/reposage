const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const apiRoot = path.join(repoRoot, 'apps', 'api');
const schemaPath = path.join(
  repoRoot,
  'apps',
  'api',
  'prisma',
  'schema.prisma',
);

function getPrismaCliPath() {
  const preferred = path.join(
    repoRoot,
    'apps',
    'api',
    'node_modules',
    'prisma',
    'build',
    'index.js',
  );

  if (existsSync(preferred)) {
    return preferred;
  }

  const fallback = path.join(
    repoRoot,
    'node_modules',
    'prisma',
    'build',
    'index.js',
  );
  if (existsSync(fallback)) {
    return fallback;
  }

  return null;
}

function resolvePrismaClientModule() {
  const requireBases = [apiRoot, repoRoot];

  for (const basePath of requireBases) {
    const packageJsonPath = path.join(basePath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      continue;
    }

    try {
      const scopedRequire = createRequire(packageJsonPath);
      return scopedRequire('@prisma/client');
    } catch {
      // Try next base path.
    }
  }

  return null;
}

async function isClientUsable() {
  const prismaClientModule = resolvePrismaClientModule();
  return Boolean(
    prismaClientModule && typeof prismaClientModule.PrismaClient === 'function',
  );
}

async function main() {
  if (await isClientUsable()) {
    console.log('Prisma client already usable. Skipping generate.');
    return;
  }

  const cliPath = getPrismaCliPath();
  if (!cliPath) {
    console.error('Could not find Prisma CLI binary to generate client.');
    process.exit(1);
  }

  const result = spawnSync(
    process.execPath,
    [cliPath, 'generate', `--schema=${schemaPath}`],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env,
    },
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  if (!(await isClientUsable())) {
    console.error('Prisma client is still not usable after generate.');
    process.exit(1);
  }

  console.log('Prisma client generated and verified.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

