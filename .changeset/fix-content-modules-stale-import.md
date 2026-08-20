---
'astro': patch
---

Fixes `content-modules.mjs` not removing entries for deleted or renamed content files, which could cause Vite to attempt to resolve non-existent modules

As part of this fix, `#moduleImports` is now fully rebuilt from `deferredRender` entries before every write, so a module import added only through the public `addModuleImport()` API without a corresponding `deferredRender` entry in the store will no longer be preserved across writes.
