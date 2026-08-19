---
'create-astro': patch
---

Fixes `npm install` warnings on npm v11+ about esbuild's install scripts not being covered by `allowScripts`. Adds `ensureNpmScriptsAllowed()` to pre-approve esbuild in `package.json` before running `npm install`, matching the existing pnpm v11 compatibility fix.
