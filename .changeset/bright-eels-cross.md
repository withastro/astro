---
'astro': minor
---

Exposes extra APIs for scripting and testing.

### Config helpers

Two new helper functions exported from `astro/config`:

- `mergeConfig()` allows users to merge partially defined Astro configurations on top of a base config while following the merge rules of `updateConfig()` available for integrations.
- `validateConfig()` allows users to validate that a given value is a valid Astro configuration and fills in default values as necessary.

These helpers are particularly useful for integration authors and for developers writing scripts that need to manipulate Astro configurations programmatically.

### Programmatic build

The `build` API now receives a second optional `BuildOptions` argument where users can specify:

- `devOutput` (default `false`): output a development-based build similar to code transformed in `astro dev`.
- `teardownCompiler` (default `true`): teardown the compiler WASM instance after build.

These options provide more control when running Astro builds programmatically, especially for testing scenarios or custom build pipelines.
