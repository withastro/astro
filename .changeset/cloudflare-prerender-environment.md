---
'@astrojs/cloudflare': minor
---

Adds a `prerenderEnvironment` option to the Cloudflare adapter. Set to `'node'` to use Astro's built-in Node.js prerender environment instead of workerd, giving prerendered pages access to the full Node.js ecosystem during both build and dev. Defaults to `'workerd'` (current behavior).
