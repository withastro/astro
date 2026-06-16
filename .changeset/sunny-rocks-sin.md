---
'astro': patch
---

Fixes Vite deprecation and build warnings in Astro 7

- Removes the deprecated `resolve.alias` `customResolver` option that produced warnings in dev and build. CSS `@import` alias resolution is now handled via a `transform` hook instead.
- Disables Rolldown's `checks.pluginTimings` warning that fired by default during builds.
