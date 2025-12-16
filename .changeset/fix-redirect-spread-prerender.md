---
"astro": patch
---

Fixes a build failure when redirecting to a spread parameter page with `output: "static"`. Dynamic redirects (with route params) that don't have a matching destination route in the route map now correctly set `prerender: false`, since we can't enumerate all possible param combinations without a destination `getStaticPaths`.

Fixes #14709
