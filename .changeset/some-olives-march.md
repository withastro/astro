---
'astro': major
---

Removes internal exports from the `astro:actions` module.

Previously, many internal classes, functions, and types were inadvertently exposed through the `astro:actions` module. This change restricts the module to export only the public utilities explicitly documented in the [Actions API Reference](https://docs.astro.build/en/reference/modules/astro-actions/).

#### What should I do?

If your project imports undocumented utilities from `astro:actions`, your build will fail. You must remove these imports and ensure you are only using the public API.
