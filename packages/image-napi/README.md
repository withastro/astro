# @astrojs/image-napi

An Astro image service that transforms images with [`@napi-rs/image`](https://image.napi.rs) (Rust) instead of Sharp (libvips). It implements the same `LocalImageService` interface as the built-in Sharp service, so `<Image />`, `<Picture />` and `getImage()` work unchanged.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { napiImageService } from '@astrojs/image-napi';

export default defineConfig({
	image: { service: napiImageService() },
});
```

## Options

| Option | Default | |
| --- | --- | --- |
| `limitInputPixels` | `0x3FFF * 0x3FFF` | Rejects larger images, like Sharp. `false` disables the limit. |
| `resizeFilter` | `'lanczos3'` | `box`, `bilinear`, `hamming`, `catmullRom`, `mitchell` or `lanczos3`. |
| `jpeg.quality` | `80` | Same number as Sharp, but not the same file size (see below). |
| `webp.quality`, `webp.lossless` | `80`, `false` | |
| `avif` | `{ quality: 50 }` | `quality`, `alphaQuality`, `speed` (rav1e, 1–10, default 4), `threads`, `chromaSubsampling` (`'4:4:4'`, `'4:2:0'`, …). |
| `png` | | `compressionType`, `filterType`. |

## Differences from the Sharp service

- Outputs `webp`, `avif`, `png` and `jpeg`. Other output formats throw.
- GIF input (including animated GIF) cannot be decoded; it is passed through unoptimized with a warning, as Sharp does for formats it cannot decode.
- `position` supports keywords (`'left top'`), percentages (`'25% 75%'`) and Sharp gravities (`'northeast'`). Sharp's `entropy` and `attention` strategies fall back to center.
- `background` supports hex, `rgb()`/`rgba()` and a few named colors. Other values are ignored with a warning.
- JPEG `quality` numbers are not equivalent: at the same number, outputs are larger (and higher quality) than Sharp's. Quality ~68 matches Sharp's default size.
- Resampling is done with premultiplied alpha. Output differs slightly from Sharp's at high-contrast and transparent edges.

## Benchmark

`node bench/compare.mjs [--runs 5] [--workloads webp,avif,jpeg,png] [--micro]` (after `pnpm build:ci` in this package and in `packages/astro`). Prefix with `UV_THREADPOOL_SIZE=12` to raise the libuv thread pool size. Both libraries run their work on that pool, and its default size is 4.

Each run is a cold `astro build`, with services alternating between runs, timing Astro's "generating optimized images" phase. Inputs are real photos from this repository, made distinct by small crops and flips. Output size, PSNR and SSIM are measured against a Sharp Lanczos3 resize of the source, which slightly favors Sharp. `--micro` times direct library calls without Astro.
