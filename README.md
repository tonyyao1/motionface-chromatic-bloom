# Chromatic Bloom · 色彩共生

A procedural sculpture study inspired by a user-supplied abstract motion reference. White filaments surround a pearlescent folded ring and 75,600 colored grains. The shape slowly turns and floats against a soft gray background.

All visible geometry is generated in TypeScript. The reference clip is not included or used as a video texture. This is an interpretation of its visual style, not an exact reconstruction of the original artwork.

## Run

Requires Node.js 22 or newer. FFmpeg and FFprobe must be on PATH for compression.

```sh
npm ci
npm run studio
npm run typecheck
npm run render
npm run compress
```

The `ChromaticBloom` composition is 900 × 1200, 30 fps, 156 frames (5.2 seconds), and intentionally silent. The master is rendered to `out/chromatic-bloom-master.mp4`. The upload version is `out/chromatic-bloom.mp4`, encoded as H.264 with fast-start playback. The compression script targets 20 MB and rejects files larger than 50 MB. It also makes a first-frame JPEG cover and measured metadata.

## Edit

- `src/Root.tsx`: composition dimensions, duration, and frame rate.
- `src/ChromaticBloom.tsx`: camera, lighting, frame-based rotation, and floating motion.
- `src/sculpture.ts`: seeded geometry, filaments, particle density, and palette.
- `remotion.config.ts`: reproducible render configuration.

All animation derives from Remotion's frame number. Geometry uses a fixed random seed, so parallel render workers produce the same sculpture. No external image, model, font, video, or audio assets are needed.

## Repository contents

Only source, configuration, dependency lockfile, and this README are tracked. Rendered files, QA images, environment files, credentials, and `node_modules` are excluded. Publishing credentials and temporary upload URLs are never part of this project.
