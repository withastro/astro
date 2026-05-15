---
'astro': patch
---

Fixes `getStaticPaths()` returning stale data during `astro dev` by clearing the route cache before each dev request. Previously, `fetch()` calls inside `getStaticPaths()` would only execute once and return cached results for the rest of the dev session, even when external API data changed. Now, `getStaticPaths()` is re-evaluated on every page request in dev mode, matching the existing behavior of frontmatter `fetch()` calls outside `getStaticPaths()`.
