---
'astro': minor
'@astrojs/node': minor
'@astrojs/mdx': minor
---

Adds support for moving server-rendered `dist/` output to another machine or directory. Run it
with `node dist/server/entry.mjs` without rebuilding.

Astro resolves internal manifest paths relative to the server entry at runtime. Public
`AstroInstance.file` and `MarkdownInstance.file` values remain absolute source paths.

The Node adapter keeps its default filesystem session storage under the relocated project root
and locates static files relative to the server entry. MDX pages continue to work with portable
output.

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
