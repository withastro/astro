---
'astro': minor
---

Adds a `--profile` flag to `astro build` to help you find what makes a build slow

When enabled, Astro records how long each part of the build takes and prints a summary at the end: build phases, the slowest routes (ranked by total render time across all of their pages), and the slowest integration hooks. The full report, including per-page and per-image timings, is written to `.astro/build-profile.json`.

```sh
astro build --profile
```
