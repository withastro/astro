---
'@astrojs/preact': patch
'@astrojs/react': patch
'@astrojs/solid-js': patch
---

Added a warning message when multiple UI frameworks are being used without either the `include` or `exclude` property being set on the integration.
