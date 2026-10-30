import {spawnSync} from 'node:child_process';
import {statSync, mkdirSync, writeFileSync} from 'node:fs';

mkdirSync('out', {recursive: true});
const input = 'out/chromatic-bloom-master.mp4';
const output = 'out/chromatic-bloom.mp4';
const run = (command, args) => {
  const r = spawnSync(command, args, {encoding: 'utf8'});
  if (r.status !== 0) throw new Error(`${command} failed: ${r.stderr}`);
  return r.stdout;
};
for (const crf of [22, 25, 28, 31]) {
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', input,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-an', output]);
  if (statSync(output).size <= 20_000_000) break;
}
const bytes = statSync(output).size;
if (bytes > 50_000_000) throw new Error('Upload file exceeds the 50 MB hard limit.');
const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', output]));
const video = probe.streams.find((stream) => stream.codec_type === 'video');
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', output,
  '-frames:v', '1', '-vf', "scale=480:480:force_original_aspect_ratio=decrease", '-q:v', '6', 'out/thumbnail.jpg']);
if (statSync('out/thumbnail.jpg').size > 65_536) throw new Error('Thumbnail exceeds 64 KB.');
const result = {
  title: 'Chromatic Bloom · 色彩共生 / Remotion 程序动效',
  mime_type: 'video/mp4', size_bytes: bytes,
  duration_ms: Math.round(Number(probe.format.duration) * 1000),
  width: video.width, height: video.height,
  sha_note: 'All visible content is procedurally generated. Reference video is not embedded.',
};
writeFileSync('out/video-metadata.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
