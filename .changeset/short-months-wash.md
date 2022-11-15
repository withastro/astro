---
'astro': patch
'@astrojs/netlify': patch
'@astrojs/node': patch
'@astrojs/vercel': patch
'@astrojs/telemetry': patch
'@astrojs/webapi': patch
---

- Brings fetch closer to the webapi by:
  * Adding URL support to fetch
  * Use webapi compatible types (e.g. fixes other type errors)
  * Removes support `node-fetch` peerDeps due to possible polyfill version conflicts
  * Switches`@astrojs/telemetry` from `node-fetch` to the `@astrojs/webapi` fetch polyfill instead (context: https://github.com/withastro/astro/pull/3417)
