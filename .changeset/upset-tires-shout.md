---
'@astrojs/markdoc': minor
'@astrojs/preact': minor
'@astrojs/svelte': minor
'@astrojs/react': minor
'@astrojs/solid-js': minor
'@astrojs/mdx': minor
'@astrojs/vue': minor
'create-astro': minor
'@astrojs/prism': minor
'@astrojs/telemetry': minor
'@astrojs/upgrade': minor
'astro': minor
---

Increases minimum Node.js version to 18.20.8

Node.js 18 has now reached end-of-life and should not be used. For now, Astro will continue to support Node.js 18.20.8, which is the final LTS release of Node.js 18, as well as Node.js 20 and Node.js 22 or later. We will drop support for Node.js 18 in a future release, so we recommend upgrading to Node.js 22 as soon as possible. See Astro's [Node.js support policy](https://docs.astro.build/en/upgrade-astro/#support) for more details.

:warning: **Important note for users of Cloudflare Pages**: The current build image for Cloudflare Pages uses Node.js 18.17.1 by default, which is no longer supported by Astro. If you are using Cloudflare Pages you should [override the default Node.js version](https://developers.cloudflare.com/pages/configuration/build-image/#override-default-versions) to Node.js 22. This does not affect users of Cloudflare Workers, which uses Node.js 22 by default.
