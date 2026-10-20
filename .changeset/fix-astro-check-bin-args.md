---
'@astrojs/check': patch
---

Fixes the `astro-check` binary ignoring its first two command-line arguments, so flags such as `--help`, `--root`, `--watch`, and `--tsconfig` are respected again. If your scripts padded the arguments to work around this (for example, `astro-check -- -- --tsconfig ./tsconfig.app.json`), remove the padding.
