---
'@astrojs/cloudflare': patch
---

Fixes user options passed to `cloudflare({...})` (`remoteBindings`, `inspectorPort`, `persistState`, `configPath`, `auxiliaryWorkers`) being silently ignored during `astro preview`. The adapter now resolves the full `@cloudflare/vite-plugin` config once at integration setup time and reuses that single resolved value across the dev/build plugin, the prerenderer's preview server, and the `astro preview` entrypoint, so user options can no longer be dropped at one of the call sites.
