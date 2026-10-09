---
'astro': minor
'@astrojs/node': minor
'@astrojs/mdx': minor
---

Adds support for portable build output. The `dist/` directory can be moved to a different
machine or directory and run with `node dist/server/entry.mjs` without rebuilding.

Astro stores directory paths in the SSR manifest relative to the server entry and resolves
them at runtime, so the built output no longer embeds the build machine's absolute directory
and image paths. Public `file` exports, such as `AstroInstance.file` and
`MarkdownInstance.file`, remain absolute.

`@astrojs/node` stores the session base relative to the project root and resolves it at
runtime, and locates the client directory relative to the server entry. `@astrojs/mdx`
normalizes compiled output paths to match the manifest keys.

#### Upgrading

Because the manifest key format changed, the new `@astrojs/mdx` requires the matching Astro
version. New Astro releases also resolve specifiers from integrations that still emit
absolute component paths, so an earlier `@astrojs/mdx` keeps working until it is upgraded.
This compatibility fallback is removed in the next major.

#### Deploying

Keep `node_modules/` co-located with `dist/` at the deployment target. Portable output
enables building in CI and deploying the artifact elsewhere, cross-platform builds such as
building on Windows and deploying on Linux, and caching build outputs across CI runs with
tools such as Turborepo.
