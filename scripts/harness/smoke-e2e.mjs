#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const ARTIFACTS_DIR = join(__dirname, '.artifacts');

const PREVIEW_PORT = Number(process.env.PREVIEW_PORT ?? 4173);
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}/`;
const GAMEPLAY_DURATION_MS = Number(process.env.GAMEPLAY_DURATION_MS ?? 30_000);

mkdirSync(ARTIFACTS_DIR, { recursive: true });

let chromium;
try {
  ({ chromium } = await import('@playwright/test'));
} catch {
  console.error('[smoke-e2e] @playwright/test is not installed.');
  console.error('  Install it with: pnpm add -D @playwright/test');
  console.error('  And install browsers with: pnpm exec playwright install chromium');
  process.exit(1);
}

function startPreview() {
  console.log(`[smoke-e2e] starting vite preview on port ${PREVIEW_PORT}`);
  const proc = spawn('pnpm', ['preview', '--port', String(PREVIEW_PORT), '--strictPort'], {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  return proc;
}

async function waitForServer(url, timeoutMs = 15_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 304) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server at ${url} did not become ready within ${timeoutMs}ms`);
}

const directions = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];

async function drive(page, durationMs) {
  const start = Date.now();
  let i = 0;
  while (Date.now() - start < durationMs) {
    await page.keyboard.press(directions[i % directions.length]);
    i++;
    await new Promise((r) => setTimeout(r, 600));
  }
}

const previewProc = startPreview();
let exitCode = 0;
const consoleErrors = [];

try {
  await waitForServer(PREVIEW_URL);
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 414, height: 896 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.goto(PREVIEW_URL, { waitUntil: 'networkidle' });
  await page.keyboard.press('Space');
  await drive(page, GAMEPLAY_DURATION_MS);

  const screenshotPath = join(ARTIFACTS_DIR, `smoke-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`[smoke-e2e] screenshot saved: ${screenshotPath}`);

  await browser.close();

  if (consoleErrors.length > 0) {
    console.error(`[smoke-e2e] ${consoleErrors.length} console error(s):`);
    for (const e of consoleErrors) console.error(`  - ${e}`);
    exitCode = 1;
  } else {
    console.log('[smoke-e2e] no console errors. ok.');
  }
} catch (err) {
  console.error(`[smoke-e2e] failure: ${err instanceof Error ? err.message : String(err)}`);
  exitCode = 1;
} finally {
  previewProc.kill('SIGTERM');
  process.exit(exitCode);
}
