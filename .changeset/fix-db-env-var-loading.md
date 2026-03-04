---
'@astrojs/db': patch
---

Fixed `ASTRO_DATABASE_FILE` environment variable not being read from `.env` files during build. The `databaseFileEnvDefined()` function now uses `getAstroEnv()` which correctly loads `ASTRO_`-prefixed env vars, instead of Vite's `loadEnv()` which defaults to only loading `VITE_`-prefixed variables.
