---
'@astrojs/cloudflare': patch
---

fix(cloudflare): forward `configPath` and other `PluginConfig` options to the Cloudflare Vite Plugin

Options like `configPath`, `inspectorPort`, `persistState`, `remoteBindings`, and `auxiliaryWorkers` were accepted by the type system but never forwarded to `cfVitePlugin()`, making them silently ignored.

Also fixes `addWatchFile` for `configPath` which resolved the path relative to the adapter's `node_modules` directory instead of the project root.
