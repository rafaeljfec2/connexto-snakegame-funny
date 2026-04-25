#!/usr/bin/env node

import { readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, basename, extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const SFX_IDS = [
  'food.eat',
  'food.timed.expire',
  'damage.hit',
  'damage.death',
  'powerup.collect',
  'powerup.expire',
  'poison.shoot',
  'poison.hit',
  'boss.spawn',
  'boss.hit',
  'boss.defeat',
  'phase.intro',
  'phase.complete',
  'ui.click',
  'ui.toggle',
];

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const srcDir = resolve(args.src ?? './raw-sfx');
const outDir = resolve(args.out ?? './public/audio');

async function main() {
  if (!existsSync(srcDir)) {
    console.error(`[audio-sprite] source dir not found: ${srcDir}`);
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });

  const files = (await readdir(srcDir)).filter((f) => /\.(wav|mp3|ogg)$/i.test(f));
  const validated = validateFiles(files);
  if (validated.errors.length > 0) {
    for (const err of validated.errors) console.error(`[audio-sprite] ${err}`);
    process.exit(1);
  }

  const manifest = await buildManifest(validated.files);
  await writeFile(join(outDir, 'sfx.json'), JSON.stringify(manifest, null, 2));
  console.log(`[audio-sprite] manifest written: ${join(outDir, 'sfx.json')}`);

  const audiospriteAvailable = hasBinary('audiosprite');
  if (audiospriteAvailable) {
    runAudiosprite(validated.files);
  } else {
    console.log(
      '[audio-sprite] manifest-only mode (audiosprite not installed). ' +
        'Generate sfx.{mp3,webm} manually and keep the JSON in sync.',
    );
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--help' || flag === '-h') out.help = true;
    if (flag === '--src') out.src = argv[++i];
    if (flag === '--out') out.out = argv[++i];
  }
  return out;
}

function printHelp() {
  console.log(`Usage: node scripts/build-audio-sprite.mjs [--src DIR] [--out DIR]
  --src DIR  directory of <sfxId>.wav|mp3|ogg files (default: ./raw-sfx)
  --out DIR  destination for sfx.{mp3,webm,json} (default: ./public/audio)
`);
}

function validateFiles(files) {
  const errors = [];
  const seen = new Map();
  for (const file of files) {
    const id = basename(file, extname(file));
    if (!SFX_IDS.includes(id)) {
      errors.push(`unknown sfx id "${id}" (file ${file}). Allowed: ${SFX_IDS.join(', ')}`);
      continue;
    }
    seen.set(id, file);
  }
  return { files: seen, errors };
}

async function buildManifest(filesById) {
  const sprite = {};
  let cursor = 0;
  for (const id of SFX_IDS) {
    const file = filesById.get(id);
    if (!file) continue;
    const { size } = await stat(join(srcDir, file));
    const estimatedDurationMs = Math.max(60, Math.round((size / 44_100 / 2) * 1000));
    sprite[id] = [cursor, estimatedDurationMs];
    cursor += estimatedDurationMs + 20;
  }
  return {
    src: ['/audio/sfx.webm', '/audio/sfx.mp3'],
    sprite,
  };
}

function hasBinary(name) {
  const probe = spawnSync('which', [name], { encoding: 'utf8' });
  return probe.status === 0 && probe.stdout.trim().length > 0;
}

function runAudiosprite(filesById) {
  const inputs = Array.from(filesById.values()).map((f) => join(srcDir, f));
  const result = spawnSync(
    'audiosprite',
    [
      '--export',
      'mp3,webm',
      '--format',
      'howler',
      '--output',
      join(outDir, 'sfx'),
      ...inputs,
    ],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) {
    console.error('[audio-sprite] audiosprite invocation failed');
    process.exit(result.status ?? 1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
