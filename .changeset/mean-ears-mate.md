---
'astro': patch
---

Add renderer support for passing named slots to framework components.

**BREAKING**: integrations using the `addRenderer()` API are now passed all named slots via `Record<string, string>` rather than `string`. Previously only the default slot was passed.
