---
'@astrojs/vercel': major
---

Makes Node.js 26 the default runtime for Vercel functions

Building with Node.js 26 now deploys functions on `nodejs26.x`. Previously, the adapter warned that Node.js 26 is unsupported and deployed functions on `nodejs24.x`. This includes Vercel builds that run on Node.js 26 because of an open `engines.node` range, such as `>=22`.

Building with a Node.js version the adapter does not list, such as 23, 25 or 27, now falls back to `nodejs26.x` instead of `nodejs24.x`.

Builds on Node.js 22 and 24 are unchanged. To keep functions on Node.js 24, build with Node.js 24, for example by setting `"engines": { "node": "24.x" }` in your `package.json`.
