#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const BASELINES_DIR = join(REPO_ROOT, 'docs', 'SDD', 'baselines');

function parseArgs(argv) {
  const args = { snapshotPath: undefined, budgetPercent: 5 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--budget=')) {
      args.budgetPercent = Number(a.split('=')[1]);
    } else if (!a.startsWith('--')) {
      args.snapshotPath = a;
    }
  }
  return args;
}

function fail(message) {
  console.error(`[perf-baseline] ${message}`);
  process.exit(1);
}

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    fail(`failed to read JSON at ${path}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

const { snapshotPath, budgetPercent } = parseArgs(process.argv);

if (!snapshotPath) {
  fail('usage: node scripts/harness/perf-baseline.mjs <perf-snapshot.json> [--budget=5]');
}
if (!existsSync(snapshotPath)) {
  fail(`snapshot not found: ${snapshotPath}`);
}

const snapshot = loadJson(snapshotPath);
const requiredFields = ['fps', 'frameIntervalP5', 'frameIntervalP95', 'phaseId'];
for (const field of requiredFields) {
  if (snapshot[field] === undefined) {
    fail(`snapshot is missing required field "${field}". See REF-01 PerfSnapshot v2 contract.`);
  }
}
if (snapshot.version !== 2) {
  fail(`unsupported snapshot version: ${snapshot.version ?? 'unknown'} (expected 2).`);
}

const deviceTag = snapshot.viewport?.dpr ? `dpr${snapshot.viewport.dpr}` : 'dprX';
const baselineName = `phase-${snapshot.phaseId}-${deviceTag}.json`;
const baselinePath = join(BASELINES_DIR, baselineName);

if (!existsSync(BASELINES_DIR)) {
  mkdirSync(BASELINES_DIR, { recursive: true });
}

if (!existsSync(baselinePath)) {
  writeFileSync(baselinePath, JSON.stringify(snapshot, null, 2));
  console.log(`[perf-baseline] no baseline found; wrote new baseline: ${baselineName}`);
  process.exit(0);
}

const baseline = loadJson(baselinePath);
const budgetRatio = 1 + budgetPercent / 100;

const deltaP95Interval = snapshot.frameIntervalP95 / baseline.frameIntervalP95;
const deltaP95Work =
  baseline.frameWorkTimeP95 > 0 ? snapshot.frameWorkTimeP95 / baseline.frameWorkTimeP95 : 1;
const deltaFps = baseline.fps / snapshot.fps;

console.log(`[perf-baseline] baseline: ${baselineName}`);
console.log(
  `  p95(frameInterval): baseline=${baseline.frameIntervalP95.toFixed(2)}ms, current=${snapshot.frameIntervalP95.toFixed(2)}ms`,
);
console.log(
  `  p95(workTime):      baseline=${(baseline.frameWorkTimeP95 ?? 0).toFixed(2)}ms, current=${(snapshot.frameWorkTimeP95 ?? 0).toFixed(2)}ms`,
);
console.log(
  `  fps:                baseline=${baseline.fps.toFixed(1)},   current=${snapshot.fps.toFixed(1)}`,
);
console.log(`  budget: +${budgetPercent}%`);

const regressions = [];
if (deltaP95Interval > budgetRatio) {
  regressions.push(
    `frameInterval p95 regressed ${((deltaP95Interval - 1) * 100).toFixed(1)}% (> ${budgetPercent}%)`,
  );
}
if (deltaP95Work > budgetRatio) {
  regressions.push(
    `frameWorkTime p95 regressed ${((deltaP95Work - 1) * 100).toFixed(1)}% (> ${budgetPercent}%)`,
  );
}
if (deltaFps > budgetRatio) {
  regressions.push(`fps regressed ${((deltaFps - 1) * 100).toFixed(1)}% (> ${budgetPercent}%)`);
}

if (regressions.length > 0) {
  console.error(`[perf-baseline] regressions detected:`);
  for (const r of regressions) {
    console.error(`  - ${r}`);
  }
  process.exit(1);
}

console.log('[perf-baseline] within budget.');
process.exit(0);
