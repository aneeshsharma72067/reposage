import { analyzeWithAI } from './aiAnalyzer';

const context = {
  repository: 'test/repo',
  commitSha: 'abc123',
  commitMessage: 'refactor user API response',
  files: [
    {
      filename: 'src/api/user.ts',
      patch: `
- return { id, name }
+ return { id, fullName }
`,
    },
  ],
};

async function run() {
  const result = await analyzeWithAI(context);

  console.log(result);
}

run();

