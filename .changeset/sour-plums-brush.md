---
'astro': minor
'@astrojs/node': patch
'@astrojs/mdx': patch
---

Adds support for portable build output. The `dist/` directory can be moved to a different
machine or directory and run with `node dist/server/entry.mjs` without rebuilding.

Astro now stores directory paths in the SSR manifest relative to the server entry and
resolves them at runtime, so the built output no longer embeds the build machine's
absolute directory and image paths. Public `file` exports, such as `AstroInstance.file`
and `MarkdownInstance.file`, stay absolute. `@astrojs/node` and `@astrojs/mdx` are updated
to support this.

This enables building in CI and deploying the artifact elsewhere, cross-platform builds
(for example, build on Windows and deploy on Linux), and caching build outputs across CI
runs with tools like Turborepo. `node_modules/` must be co-located with `dist/` at the
deployment target.
