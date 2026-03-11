---
astro: patch
---

Improves Astro core's dev environment handling for prerender routes by ensuring route/CSS updates and prerender middleware behavior work correctly across SSR and prerender environments.

This enables integrations that use Astro's prerender dev environment (such as Cloudflare with `prerenderEnvironment: 'node'`) to get consistent route matching and HMR behavior during development.
