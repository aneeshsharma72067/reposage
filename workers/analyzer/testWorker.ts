import { analyzeWithAI } from '../../packages/ai/aiAnalyzer';
import { compressDiff } from '../../packages/shared/src/diffCompression';

async function run() {
  const commitFiles = [
    {
      filename: 'src/api/user.ts',
      additions: 10,
      deletions: 2,
      patch: `
- return { id, name }
+ return { id, fullName }
`,
    },
  ];

  const compressed = compressDiff(commitFiles);

  const context = {
    repository: 'demo-repo',
    commitSha: '123',
    commitMessage: 'change API response',
    files: compressed,
  };

  const aiFindings = await analyzeWithAI(context);

  console.log('AI Findings:', aiFindings);
}

run();

