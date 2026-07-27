---
'astro': patch
---

Fixes a case where a custom `logger.entrypoint` failed to load at runtime in a built server bundle.

The configured log handler is now bundled at build time instead of being imported from the serialized manifest at runtime, which means it no longer needs to be resolvable from the deployed output.
