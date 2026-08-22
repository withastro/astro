---
'@astrojs/check': patch
---

Fixes `astro check` crashing with an opaque `ERR_PACKAGE_PATH_NOT_EXPORTED` error when TypeScript is installed but doesn't expose a default CJS export (as with TypeScript 7's native compiler). It now shows a clear, actionable message explaining that TypeScript 7's native compiler doesn't yet ship the programmatic Language Service API `astro check` relies on, instead of crashing or falling back to a misleading "please install typescript" prompt.

Full `astro check` support for TypeScript 7 is tracked separately in [withastro/roadmap#1321](https://github.com/withastro/roadmap/discussions/1321) and requires TypeScript to ship that API first.
