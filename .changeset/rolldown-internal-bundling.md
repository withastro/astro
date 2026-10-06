---
'astro': patch
'@astrojs/netlify': patch
'@astrojs/vercel': patch
'@astrojs/markdoc': patch
'astro-vscode': patch
---

Refactors internal bundling and code transforms to use Vite's Oxc-based `transformWithOxc` and Rolldown instead of esbuild. These packages no longer depend on esbuild directly.
