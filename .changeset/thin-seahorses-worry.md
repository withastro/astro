---
'@astrojs/cloudflare': major
'@astrojs/deno': major
'@astrojs/netlify': major
'@astrojs/node': major
'@astrojs/svelte': major
'@astrojs/tailwind': major
'@astrojs/vercel': major
'@astrojs/vue': major
'@astrojs/markdown-remark': major
'@astrojs/image': minor
---

Make astro a peerDependency of integrations

This marks `astro` as a peerDependency of serveral packages that are already getting `major` version bumps. This is so we can more properly track the dependency between them and what version of Astro they are being used with.
