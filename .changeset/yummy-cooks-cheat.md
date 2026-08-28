---
'astro': minor
---

Adds support for a custom `src/pages/3xx.astro` redirect page and a `redirectDelay` configuration option

The custom page receives the redirect's `status`, `redirectFrom`, and `redirectTo` values through `Astro.props`. When no custom page exists, `redirectDelay` controls the delay in seconds used by Astro's built-in HTML redirect page during static builds.
