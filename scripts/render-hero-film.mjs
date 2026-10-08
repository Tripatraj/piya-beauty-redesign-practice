/**
 * Free, local photographic motion render. No generated packaging or paid API.
 * Run: node scripts/render-hero-film.mjs [square|portrait|wide|all]
 * Requires FFmpeg with libx264/libvpx-vp9. Set FFMPEG_PATH if not in the local tools folder.
 * Sources stay outside dist; only web encodes/posters are shipped.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ffmpeg = process.env.FFMPEG_PATH || resolve(root, 'work/media-tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const sourceDir = resolve(root, 'work/hero-film/sources');
const scratch = resolve(root, 'work/hero-film/render');
const output = resolve(root, 'dist/media/hero');
mkdirSync(scratch, { recursive: true });
mkdirSync(output, { recursive: true });

const catalogue = {
  lotion: {
    file: 'turmeric-face-lotion-01.jpg',
    page: 'https://piyabeauty.com/products/turmeric-face-lotion',
    source: 'https://cdn.shopify.com/s/files/1/0692/1777/9889/files/PIYA_moisturizer_product_images.jpg?v=1776928791',
  },
  cleanser: {
    file: 'turmeric-foaming-cleanser-01.jpg',
    page: 'https://piyabeauty.com/products/turmeric-foaming-cleanser',
    source: 'https://cdn.shopify.com/s/files/1/0692/1777/9889/files/PIYA_Cleanser_product_images_f0c2b68b-5459-4148-82a3-c11d0a00c9f1.jpg?v=1783719145',
  },
  serum: {
    file: 'piya-bakuchiol-serum-01.png',
    page: 'https://piyabeauty.com/products/piya-bakuchiol-serum',
    source: 'https://cdn.shopify.com/s/files/1/0692/1777/9889/files/ChatGPTImageMar25_2026_03_12_33PM.png?v=1774462494',
  },
  collection: {
    file: 'glow-turmeric-ritual-set-02.png',
    page: 'https://piyabeauty.com/products/glow-turmeric-ritual-set',
    source: 'https://cdn.shopify.com/s/files/1/0692/1777/9889/files/glowbargift3.png?v=1762853881',
  },
};

// 5 x 3.4 seconds with four 0.5-second dissolves = 15 seconds / 450 frames.
const FPS = 30;
const shotFrames = 102;
const transition = 0.5;
const shots = [
  { product: 'lotion', zoom: [1.28, 1.015], center: [.50, .53], name: 'The reveal' },
  { product: 'cleanser', zoom: [1.025, 1.065], center: [.50, .54], name: 'Botanical detail' },
  { product: 'serum', zoom: [1.04, 1.005], center: [.50, .5], name: 'Amber and glass' },
  { product: 'collection', zoom: [1.0, 1.045], center: [.50, .53], name: 'The collection' },
  { product: 'lotion', zoom: [1.015, 1.28], center: [.50, .53], name: 'Return to the hero' },
];
const renditions = {
  square: { w: 960, h: 960 },
  portrait: { w: 864, h: 1152 },
  wide: { w: 1280, h: 720 },
};

function run(args) {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`FFmpeg failed (${result.status})`);
}

function framing(product, ratio) {
  // Fit the original white-background shots into a continuous ivory field.
  // Their photographed shadows, ingredients and labels remain the source pixels.
  if (product === 'lotion' || product === 'cleanser') {
    const h = 1800;
    const w = Math.round(h * ratio / 2) * 2;
    const size = Math.round(Math.min(h * .94, w * 1.16) / 2) * 2;
    return `scale=${size}:${size}:flags=lanczos,pad=${Math.max(w, size)}:${h}:(ow-iw)/2:(oh-ih)/2:white,crop=${w}:${h},colorchannelmixer=rr=.992:gg=.98:bb=.953`;
  }
  if (product === 'serum') {
    // On wide containers this is an intentional macro of the label and amber glass.
    // Portrait/square versions retain the complete dropper and bottle.
    const h = Math.round(940 / ratio / 2) * 2;
    const y = ratio > 1.35 ? 592 : ratio < .85 ? 180 : 280;
    return `crop=940:${h}:0:${y}`;
  }
  // The collection is kept complete, including the soap at camera-left.
  if (ratio > 1.35) return 'crop=1024:576:0:250';
  if (ratio < .85) return 'pad=1024:1366:0:171:color=0xd9c3a4';
  return 'null';
}

function render(name) {
  const { w, h } = renditions[name];
  const clipPaths = [];
  shots.forEach((shot, i) => {
    const source = resolve(sourceDir, catalogue[shot.product].file);
    if (!existsSync(source)) throw new Error(`Missing official reference: ${source}`);
    const dest = resolve(scratch, `${name}-${i + 1}.mp4`);
    clipPaths.push(dest);
    // Oversample before zoompan to avoid integer-coordinate judder on slow movement.
    const p = `on/${shotFrames - 1}`;
    const ease = `((${p})*(${p})*(3-2*(${p})))`;
    const z = `${shot.zoom[0]}+(${shot.zoom[1]}-${shot.zoom[0]})*${ease}`;
    const filter = [
      framing(shot.product, w / h),
      `scale=${w * 3}:${h * 3}:flags=lanczos`,
      `zoompan=z='${z}':x='(iw-iw/zoom)*${shot.center[0]}':y='(ih-ih/zoom)*${shot.center[1]}':d=${shotFrames}:s=${w}x${h}:fps=${FPS}`,
      // A restrained exposure drift, optical softness and fine grain, not a fake 3D orbit.
      'eq=brightness=0.003:saturation=.985',
      'vignette=angle=PI/10',
      'gblur=sigma=.13',
      'setsar=1',
      'format=yuv420p',
    ].join(',');
    console.log(`Rendering ${name}: ${shot.name}`);
    if (!process.argv.includes('--finish')) run(['-i', source, '-vf', filter, '-frames:v', String(shotFrames), '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-threads', '4', dest]);
  });
  const master = resolve(scratch, `piya-film-${name}-master.mp4`);
  const filters = [];
  clipPaths.forEach((_, i) => filters.push(`[${i}:v]setpts=PTS-STARTPTS,fps=${FPS},settb=AVTB[s${i}]`));
  let previous = 's0';
  for (let i = 1; i < shots.length; i++) {
    const next = `f${i}`;
    filters.push(`[${previous}][s${i}]xfade=transition=fade:duration=${transition}:offset=${(i * (shotFrames / FPS - transition)).toFixed(3)},fps=${FPS},settb=AVTB[${next}]`);
    previous = next;
  }
  console.log(`Finishing ${name}: 15s loop`);
  run([...clipPaths.flatMap(p => ['-i', p]), '-filter_complex_threads', '2', '-filter_complex', filters.join(';'), '-map', `[${previous}]`, '-frames:v', '450', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-pix_fmt', 'yuv420p', '-threads', '4', master]);
  run(['-i', master, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-threads', '4', resolve(output, `piya-film-${name}.mp4`)]);
  run(['-i', master, '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-deadline', 'good', '-cpu-used', '3', '-row-mt', '1', '-threads', '4', resolve(output, `piya-film-${name}.webm`)]);
  // Collection frame provides a warm, composed fallback before motion begins.
  run(['-ss', '10.8', '-i', master, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '88', resolve(output, `piya-poster-${name}.webp`)]);
  run(['-i', master, '-vf', 'fps=1,scale=240:-1,tile=5x3', '-frames:v', '1', '-update', '1', resolve(scratch, `${name}-contact.jpg`)]);
  for (const ext of ['mp4', 'webm']) console.log(`${name}.${ext}: ${(statSync(resolve(output, `piya-film-${name}.${ext}`)).size / 1048576).toFixed(2)} MiB`);
}

const requested = process.argv[2] || 'all';
if (requested !== 'all' && !renditions[requested]) throw new Error('Use square, portrait, wide, or all.');
for (const name of requested === 'all' ? Object.keys(renditions) : [requested]) render(name);
writeFileSync(resolve(scratch, 'provenance.json'), JSON.stringify({
  method: 'Locally rendered photographic motion design; not generated live-action footage.',
  duration: 15, fps: FPS, audio: false, paidServices: false,
  sourceOfTruth: 'https://piyabeauty.com/', catalogue, shots, renditions,
  packagingPolicy: 'Only original source photograph pixels. No label replacement, warping, synthetic bottle or promotional text overlays.',
}, null, 2));
