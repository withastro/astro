# @astrojs/runtime

The runtime that compiled Astro components import and render with: the server render runtime, the client directive scripts, the JSX runtime, `AstroError` and the error data. It does not depend on Vite or the Astro compiler.

## `_internal/`

`@astrojs/runtime/_internal/*` exposes the modules under `src/internal/` (built to `dist/internal/`) to the other packages of the Astro monorepo. It is not public API: it has no stability guarantees and may change in any release.
