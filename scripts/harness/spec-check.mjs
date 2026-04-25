#!/usr/bin/env node
import { execSync } from 'node:child_process';

const SPEC_PATTERN = /REF-\d{2}-(FR|AC|NFR)-\d+/;
const HOTFIX_PATTERN = /^\[hotfix\]/i;

function readEnvOrCmd(envName, cmd) {
  if (process.env[envName] && process.env[envName].trim().length > 0) {
    return process.env[envName];
  }
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const prBody = process.env.PR_BODY ?? '';
const lastCommitMessage = readEnvOrCmd('COMMIT_MESSAGE', 'git log -1 --pretty=%B');
const branch = readEnvOrCmd('BRANCH_NAME', 'git rev-parse --abbrev-ref HEAD');

const haystack = [prBody, lastCommitMessage, branch].join('\n');

if (HOTFIX_PATTERN.test(lastCommitMessage)) {
  console.log('[spec-check] hotfix prefix detected; skipping spec reference check.');
  process.exit(0);
}

const match = haystack.match(SPEC_PATTERN);
if (!match) {
  console.error('[spec-check] no REF-XX-(FR|AC|NFR)-N reference found.');
  console.error('  Searched in: PR body, last commit message, branch name.');
  console.error('  Bypass: prefix the commit subject with "[hotfix]" (documented escape hatch).');
  console.error(`  Branch: ${branch}`);
  console.error(`  Last commit: ${lastCommitMessage.split('\n')[0]}`);
  process.exit(1);
}

console.log(`[spec-check] reference found: ${match[0]}`);
process.exit(0);
