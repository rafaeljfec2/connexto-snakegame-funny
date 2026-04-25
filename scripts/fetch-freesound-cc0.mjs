#!/usr/bin/env node

import { mkdir, writeFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';

const OUT_DIR = resolve(process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : './raw-sfx');

const FORCE = process.argv.includes('--force');
const THROTTLE_MS = 750;
const UA = 'Mozilla/5.0 (compatible; ConnextoSnake/1.0; +https://github.com)';

const QUERIES = [
  { id: 'food.eat',          q: 'pickup coin retro',           dur: [0.05, 0.6] },
  { id: 'food.timed.expire', q: 'warning beep alarm',          dur: [0.1, 2.0] },
  { id: 'powerup.collect',   q: 'powerup collect arcade',      dur: [0.2, 1.2] },
  { id: 'powerup.expire',    q: 'powerdown',                   dur: [0.1, 2.5] },
  { id: 'damage.hit',        q: 'hit hurt 8bit',               dur: [0.05, 0.5] },
  { id: 'damage.death',      q: 'game over 8bit',              dur: [0.5, 2.5] },
  { id: 'poison.shoot',      q: 'laser shoot 8bit',            dur: [0.05, 0.6] },
  { id: 'poison.hit',        q: 'impact 8bit hit',             dur: [0.05, 0.6] },
  { id: 'boss.spawn',        q: 'monster growl short',         dur: [0.3, 3.0] },
  { id: 'boss.hit',          q: 'punch hit thud',              dur: [0.05, 0.8] },
  { id: 'boss.defeat',       q: 'explosion 8bit',              dur: [0.4, 3.5] },
  { id: 'phase.intro',       q: 'level start 8bit',            dur: [0.2, 2.5] },
  { id: 'phase.complete',    q: 'level complete 8bit jingle',  dur: [0.5, 3.0] },
  { id: 'ui.click',          q: 'ui click button',             dur: [0.03, 0.3] },
  { id: 'ui.toggle',         q: 'ui toggle switch',            dur: [0.05, 0.5] },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const sources = [];
  const failures = [];

  for (const entry of QUERIES) {
    const target = join(OUT_DIR, `${entry.id}.mp3`);
    if (!FORCE && existsSync(target)) {
      const { size } = await stat(target);
      console.log(`[skip] ${entry.id} already present (${size} bytes). Use --force to refetch.`);
      continue;
    }

    try {
      const pick = await searchAndPick(entry);
      if (!pick) {
        failures.push({ id: entry.id, reason: 'no candidate' });
        console.warn(`[miss] ${entry.id}: no candidate found`);
        continue;
      }
      await sleep(THROTTLE_MS);
      const previewUrl = await fetchPreviewUrl(pick.path);
      if (!previewUrl) {
        failures.push({ id: entry.id, reason: 'preview not found' });
        console.warn(`[miss] ${entry.id}: preview URL not found at ${pick.path}`);
        continue;
      }
      await sleep(THROTTLE_MS);
      const bytes = await downloadBinary(previewUrl, target);
      console.log(`[ok]   ${entry.id} -> ${pick.path} (${bytes} bytes)`);
      sources.push({
        id: entry.id,
        query: entry.q,
        soundUrl: `https://freesound.org${pick.path}`,
        previewUrl,
        license: 'Creative Commons 0',
        bytes,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      failures.push({ id: entry.id, reason: String(err) });
      console.error(`[err]  ${entry.id}: ${err}`);
    }
    await sleep(THROTTLE_MS);
  }

  if (sources.length > 0) {
    const sidecar = join(OUT_DIR, 'SOURCES.json');
    await writeFile(sidecar, JSON.stringify({ generatedAt: new Date().toISOString(), sources, failures }, null, 2));
    console.log(`\n[done] ${sources.length}/${QUERIES.length} ok. Sidecar: ${sidecar}`);
  }

  if (failures.length > 0) {
    console.warn(`\n[warn] ${failures.length} failures:`);
    for (const f of failures) console.warn(`  - ${f.id}: ${f.reason}`);
    process.exitCode = 1;
  }
}

async function searchAndPick(entry) {
  const filter = `license:"Creative Commons 0" duration:[${entry.dur[0]} TO ${entry.dur[1]}]`;
  const url = `https://freesound.org/search/?q=${encodeURIComponent(entry.q)}&f=${encodeURIComponent(filter)}&s=score+desc`;
  const html = await fetchText(url);
  const re = /\/people\/[^/"]+\/sounds\/\d+\//g;
  const seen = new Set();
  const paths = [];
  for (const match of html.matchAll(re)) {
    const path = match[0];
    if (!seen.has(path)) {
      seen.add(path);
      paths.push(path);
    }
  }
  if (paths.length === 0) return null;
  return { path: paths[0] };
}

async function fetchPreviewUrl(soundPath) {
  const html = await fetchText(`https://freesound.org${soundPath}`);
  const hq = html.match(/https:\/\/cdn\.freesound\.org\/previews\/[^"']+-hq\.mp3/);
  if (hq) return hq[0];
  const lq = html.match(/https:\/\/cdn\.freesound\.org\/previews\/[^"']+-lq\.mp3/);
  return lq ? lq[0] : null;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function downloadBinary(url, target) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(target, buf);
  return buf.byteLength;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
