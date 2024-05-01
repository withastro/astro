---
"astro": minor
"@astrojs/vercel": patch
---

Adds a new `--viteMode <mode>` CLI flag for `dev` and `build` commands
to allow you to override the default `development` and `production` modes.
This is useful for custom `import.meta.env.MODE` values and loading different `.env.[mode]` files.
