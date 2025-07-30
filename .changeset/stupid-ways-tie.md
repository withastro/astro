---
'create-astro': major
'@astrojs/upgrade': major
---

Update to the new way the spawn command must be used, after the use of arrays was deprecated in Node.js 24 when the shell option is enabled, 

ref: https://nodejs.org/api/deprecations.html#DEP0190, https://github.com/nodejs/node/pull/57199 https://github.com/nodejs/help/issues/5063#issuecomment-3132899776
