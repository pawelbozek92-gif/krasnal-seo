// Encodes the hero video and welcome audio from media-src/ into public/video and public/audio.
// Requires ffmpeg: on PATH, or set FFMPEG=/path/to/ffmpeg.
//   node scripts/encode-media.mjs
//
// Sources (not published):
//   media-src/hero-source.mp4  – master animation (any size, audio track is dropped)
//   media-src/jingle.wav       – jingle master
//   media-src/powitanie.mp3    – voice master
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { hero as heroCfg } from '../src/data/motion.ts';

const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const SRC = 'media-src';
const ff = (...args) => execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

for (const f of ['hero-source.mp4', 'jingle.wav', 'powitanie.mp3']) {
  if (!existsSync(`${SRC}/${f}`)) throw new Error(`Missing ${SRC}/${f}`);
}
mkdirSync('public/video', { recursive: true });
mkdirSync('public/audio', { recursive: true });

const video = `${SRC}/hero-source.mp4`;
const sizes = [
  { name: 'hero', w: 1280, h: 720, crf264: 27, crfVp9: 38 },
  { name: 'hero-mobile', w: 854, h: 480, crf264: 28, crfVp9: 39 },
];

for (const s of sizes) {
  const scale = `scale=${s.w}:${s.h}:flags=lanczos,format=yuv420p`;
  console.log(`video  ${s.name}.mp4`);
  ff('-i', video, '-an', '-vf', scale, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(s.crf264), '-profile:v', 'high', '-g', '48', '-movflags', '+faststart', `public/video/${s.name}.mp4`);
  console.log(`video  ${s.name}.webm`);
  ff('-i', video, '-an', '-vf', scale, '-c:v', 'libvpx-vp9', '-crf', String(s.crfVp9), '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-g', '48', `public/video/${s.name}.webm`);
}

// Poster = first frame; static = payoff frame (bar at the top, chart and pin complete).
console.log('image  hero-poster.webp, hero-static.webp');
ff('-i', video, '-frames:v', '1', '-vf', 'scale=1280:720', '-c:v', 'libwebp', '-quality', '70', 'public/video/hero-poster.webp');
ff('-ss', String(heroCfg.payoffTime), '-i', video, '-frames:v', '1', '-vf', 'scale=1280:720', '-c:v', 'libwebp', '-quality', '75', 'public/video/hero-static.webp');

// Audio: loudness-matched to -16 LUFS. Jingle trimmed to its musical end with a short tail fade.
const loud = 'loudnorm=I=-16:TP=-1.5:LRA=11';
const jingleEnd = 15.4;
const jingleFilter = `atrim=0:${jingleEnd},afade=t=out:st=${jingleEnd - 0.4}:d=0.4,${loud}`;
console.log('audio  jingle.opus/.mp3, powitanie.opus/.mp3');
ff('-i', `${SRC}/jingle.wav`, '-af', jingleFilter, '-ar', '48000', '-c:a', 'libopus', '-b:a', '96k', 'public/audio/jingle.opus');
ff('-i', `${SRC}/jingle.wav`, '-af', jingleFilter, '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '160k', 'public/audio/jingle.mp3');
ff('-i', `${SRC}/powitanie.mp3`, '-af', loud, '-ac', '1', '-ar', '48000', '-c:a', 'libopus', '-b:a', '48k', 'public/audio/powitanie.opus');
ff('-i', `${SRC}/powitanie.mp3`, '-af', loud, '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '96k', 'public/audio/powitanie.mp3');

console.log('done');
