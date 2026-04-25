#!/usr/bin/env node

import { readdir, writeFile, mkdir, unlink } from 'node:fs/promises';
import { join, basename, extname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
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
const gapMs = Number.isFinite(args.gap) ? args.gap : 80;

async function main() {
  if (!existsSync(srcDir)) {
    console.error(`[audio-sprite] source dir not found: ${srcDir}`);
    process.exit(1);
  }
  ensureBinary('ffmpeg');
  ensureBinary('ffprobe');

  await mkdir(outDir, { recursive: true });

  const files = (await readdir(srcDir)).filter((f) => /\.(wav|mp3|ogg)$/i.test(f));
  const ordered = orderFiles(files);
  if (ordered.errors.length > 0) {
    for (const err of ordered.errors) console.error(`[audio-sprite] ${err}`);
    process.exit(1);
  }

  const tracks = await Promise.all(
    ordered.entries.map(async (entry) => ({
      ...entry,
      durationMs: await probeDurationMs(join(srcDir, entry.file)),
    })),
  );

  const sprite = {};
  let cursorMs = 0;
  for (const track of tracks) {
    sprite[track.id] = [cursorMs, track.durationMs];
    cursorMs += track.durationMs + gapMs;
  }

  const mp3Out = join(outDir, 'sfx.mp3');
  const webmOut = join(outDir, 'sfx.webm');
  const concatList = join(tmpdir(), `connexto-sfx-${process.pid}.txt`);
  await writeConcatList(concatList, tracks, gapMs);

  console.log(`[audio-sprite] encoding ${mp3Out}`);
  runFfmpeg([
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', concatList,
    '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100', '-ac', '1',
    mp3Out,
  ]);

  console.log(`[audio-sprite] encoding ${webmOut}`);
  runFfmpeg([
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', concatList,
    '-c:a', 'libopus', '-b:a', '96k', '-ar', '48000', '-ac', '1',
    webmOut,
  ]);

  const manifest = {
    src: ['/audio/sfx.webm', '/audio/sfx.mp3'],
    sprite,
  };
  await writeFile(join(outDir, 'sfx.json'), JSON.stringify(manifest, null, 2));
  await safeUnlink(concatList);

  console.log(`\n[audio-sprite] done. ${tracks.length} clips, total ~${(cursorMs / 1000).toFixed(2)}s`);
  console.log(`  ${mp3Out}`);
  console.log(`  ${webmOut}`);
  console.log(`  ${join(outDir, 'sfx.json')}`);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--help' || flag === '-h') out.help = true;
    if (flag === '--src') out.src = argv[++i];
    if (flag === '--out') out.out = argv[++i];
    if (flag === '--gap') out.gap = Number(argv[++i]);
  }
  return out;
}

function printHelp() {
  console.log(`Usage: node scripts/build-audio-sprite.mjs [--src DIR] [--out DIR] [--gap MS]
  --src DIR  directory of <sfxId>.wav|mp3|ogg files (default: ./raw-sfx)
  --out DIR  destination for sfx.{mp3,webm,json} (default: ./public/audio)
  --gap MS   silence inserted between sprites in ms (default: 80)
`);
}

function orderFiles(files) {
  const errors = [];
  const byId = new Map();
  for (const file of files) {
    const id = basename(file, extname(file));
    if (!SFX_IDS.includes(id)) {
      errors.push(`unknown sfx id "${id}" (file ${file}). Allowed: ${SFX_IDS.join(', ')}`);
      continue;
    }
    byId.set(id, file);
  }
  const entries = SFX_IDS.filter((id) => byId.has(id)).map((id) => ({ id, file: byId.get(id) }));
  if (entries.length === 0) errors.push('no usable audio files found in src dir');
  return { entries, errors };
}

async function probeDurationMs(file) {
  const r = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) throw new Error(`ffprobe failed for ${file}: ${r.stderr}`);
  const seconds = Number.parseFloat(r.stdout.trim());
  if (!Number.isFinite(seconds)) throw new Error(`ffprobe parsed NaN for ${file}`);
  return Math.round(seconds * 1000);
}

async function writeConcatList(listPath, tracks, gapMs) {
  const silenceMp3 = await ensureSilenceClip(gapMs);
  const lines = [];
  for (let i = 0; i < tracks.length; i++) {
    lines.push(`file '${escapeForConcat(join(srcDir, tracks[i].file))}'`);
    if (i < tracks.length - 1 && gapMs > 0) {
      lines.push(`file '${escapeForConcat(silenceMp3)}'`);
    }
  }
  await writeFile(listPath, lines.join('\n'));
}

async function ensureSilenceClip(gapMs) {
  if (gapMs <= 0) return null;
  const target = join(tmpdir(), `connexto-silence-${gapMs}ms.mp3`);
  if (existsSync(target)) return target;
  runFfmpeg([
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono`,
    '-t', String(gapMs / 1000),
    '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100', '-ac', '1',
    target,
  ]);
  return target;
}

function escapeForConcat(path) {
  return path.replace(/'/g, `'\\''`);
}

function runFfmpeg(args) {
  const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${args.join(' ')}`);
}

function ensureBinary(name) {
  const r = spawnSync('which', [name], { encoding: 'utf8' });
  if (r.status !== 0 || !r.stdout.trim()) {
    console.error(`[audio-sprite] required binary not found: ${name}`);
    process.exit(1);
  }
}

async function safeUnlink(path) {
  try {
    await unlink(path);
  } catch {}
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
