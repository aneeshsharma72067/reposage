import { largeCommitRule } from './largeCommit.rule';
import { largeDiffRule } from './largeDiff.rule';
import { sensitiveFilesRule } from './sensitiveFiles.rule';

export { largeCommitRule, sensitiveFilesRule, largeDiffRule };

export const analysisRules = [
  largeCommitRule,
  sensitiveFilesRule,
  largeDiffRule,
];

