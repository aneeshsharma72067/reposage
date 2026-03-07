import type { AnalysisContext } from '../types';

function formatFilesForPrompt(context: AnalysisContext): string {
  return context.files
    .map((file) => {
      return [`File: ${file.filename}`, 'Patch:', file.patch, '---'].join('\n');
    })
    .join('\n');
}

export function buildCommitPrompt(context: AnalysisContext): string {
  const filesSection = formatFilesForPrompt(context);

  return [
    'You are a senior software engineer performing a strict commit review.',
    'Analyze the commit diff and identify high-value issues only.',
    '',
    'Focus areas:',
    '- API contract changes',
    '- Security risks',
    '- Architectural violations',
    '- Performance issues',
    '',
    'Output requirements:',
    '- Return STRICT JSON only.',
    '- Do not include markdown fences, prose, or extra keys.',
    '- Use this exact shape:',
    '{',
    '  "findings": [',
    '    {',
    '      "type": "",',
    '      "severity": "INFO|WARNING|CRITICAL",',
    '      "title": "",',
    '      "description": "",',
    '      "file": ""',
    '    }',
    '  ]',
    '}',
    '',
    'Type guidance:',
    '- Prefer one of: API_BREAK, ARCH_VIOLATION, REFACTOR_SUGGESTION.',
    '',
    `Repository: ${context.repository}`,
    `Commit SHA: ${context.commitSha}`,
    `Commit Message: ${context.commitMessage}`,
    '',
    'Compressed Diff:',
    filesSection,
  ].join('\n');
}

