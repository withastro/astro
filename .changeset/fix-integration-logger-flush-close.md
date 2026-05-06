---
'astro': patch
---

Adds `flush()` and `close()` methods to `AstroIntegrationLogger`, mirroring `AstroLogger`. Both delegate to the underlying destination's optional `flush`/`close` hooks. Previously, only `AstroLogger` exposed these methods, so any code path that put an `AstroIntegrationLogger` instance where an `AstroLogger` was expected (e.g. `App.#prepareResponse` calling `this.logger.flush()`) would crash with `TypeError: this.logger.flush is not a function`. The two logger classes now have a symmetric public surface.
