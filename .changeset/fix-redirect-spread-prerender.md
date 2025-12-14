---
"astro": patch
---

Fixes a build failure when redirecting to a spread parameter page with `output: "static"`. Dynamic redirects (with route params) now correctly set `prerender: false` since we can't enumerate all possible param combinations for a redirect.

Fixes #14709
