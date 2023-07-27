---
'astro': major
'@astrojs/netlify': major
'@astrojs/vercel': major
'@astrojs/node': major
---

Reduced the amount of polyfills provided by Astro. Astro will no longer provide (no-op) polyfills for several web apis such as HTMLElement, Image or Document. If you need access to those APIs on the server, we recommend using more proper polyfills available on npm.
