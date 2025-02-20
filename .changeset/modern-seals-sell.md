---
'astro': patch
---

Ensures that `Astro.url`/`ctx.url` is correctly updated with the `base` path after rewrites.

This change fixes an issue where `Astro.url`/`ctx.url` did not include the configured base path after Astro.rewrite was called. Now, the base path is correctly reflected in Astro.url.

Previously, any rewrites performed through `Astro.rewrite`/`ctx.rewrite` failed to append the base path to `Astro.url`/`ctx.rewrite`, which could lead to incorrect URL handling in downstream logic. By fixing this, we ensure that all routes remain consistent and predictable after a rewrite.

If you were relying on the work around of including the base path in astro.rewrite you can now remove it from the path.
